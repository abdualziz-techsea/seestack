package com.seestack.modules.monitors.service;

import com.seestack.ingestion.kafka.MonitorCheckKafkaEvent;
import com.seestack.modules.alerts.service.AlertEvaluationService;
import com.seestack.modules.monitors.entity.MonitorConfigEntity;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.jspecify.annotations.NullMarked;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@NullMarked
public class MonitorScheduler {

    private static final Logger log = LoggerFactory.getLogger(MonitorScheduler.class);
    private static final String TOPIC = "seestack.monitor-checks";
    private static final Duration TIMEOUT = Duration.ofSeconds(30);

    private final MonitorService monitorService;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;
    private final AlertEvaluationService alertEvaluation;
    private final HttpClient httpClient;

    /** Tracks last check time per monitor to respect intervals */
    private final Map<java.util.UUID, Instant> lastCheckTimes = new ConcurrentHashMap<>();

    public MonitorScheduler(MonitorService monitorService,
                            KafkaTemplate<String, String> kafkaTemplate,
                            ObjectMapper objectMapper,
                            AlertEvaluationService alertEvaluation) {
        this.monitorService = monitorService;
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
        this.alertEvaluation = alertEvaluation;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(TIMEOUT)
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();
    }

    @Scheduled(fixedRate = 60_000) // run every minute
    public void runChecks() {
        List<MonitorConfigEntity> monitors = monitorService.findActiveMonitors();
        Instant now = Instant.now();

        for (MonitorConfigEntity monitor : monitors) {
            if (shouldCheck(monitor, now)) {
                lastCheckTimes.put(monitor.getId(), now);
                performCheck(monitor);
            }
        }
    }

    private boolean shouldCheck(MonitorConfigEntity monitor, Instant now) {
        Instant lastCheck = lastCheckTimes.get(monitor.getId());
        if (lastCheck == null) return true;
        long elapsedMinutes = Duration.between(lastCheck, now).toMinutes();
        return elapsedMinutes >= monitor.getIntervalMinutes();
    }

    private void performCheck(MonitorConfigEntity monitor) {
        long startMs = System.currentTimeMillis();
        int status;
        int responseTimeMs;
        int statusCode;

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(monitor.getUrl()))
                    .timeout(TIMEOUT)
                    .GET()
                    .build();

            HttpResponse<Void> response = httpClient.send(request, HttpResponse.BodyHandlers.discarding());
            responseTimeMs = (int) (System.currentTimeMillis() - startMs);
            statusCode = response.statusCode();
            status = isUp(statusCode, responseTimeMs) ? 1 : 0;

        } catch (Exception e) {
            responseTimeMs = (int) (System.currentTimeMillis() - startMs);
            statusCode = 0;
            status = 0;
            log.debug("Monitor check failed for {} ({}): {}", monitor.getName(), monitor.getUrl(), e.getMessage());
        }

        publishResult(monitor, status, responseTimeMs, statusCode);

        // Trigger alerts
        if (status == 0) {
            alertEvaluation.onMonitorDown(monitor.getProjectId(), monitor.getId(),
                    monitor.getName(), monitor.getUrl());
        }
        alertEvaluation.onMonitorSlowResponse(monitor.getProjectId(), monitor.getId(),
                monitor.getName(), responseTimeMs);
    }

    /**
     * Determines if a check result is considered UP.
     * Public for unit testing.
     */
    public static boolean isUp(int statusCode, int responseTimeMs) {
        return statusCode >= 200 && statusCode < 400 && responseTimeMs < 30_000;
    }

    private void publishResult(MonitorConfigEntity monitor, int status, int responseTimeMs, int statusCode) {
        try {
            var event = new MonitorCheckKafkaEvent(
                    monitor.getId(),
                    monitor.getProjectId(),
                    status,
                    responseTimeMs,
                    statusCode,
                    System.currentTimeMillis()
            );
            kafkaTemplate.send(TOPIC, monitor.getId().toString(), objectMapper.writeValueAsString(event));
            log.debug("Monitor check: {} status={} time={}ms code={}",
                    monitor.getName(), status == 1 ? "UP" : "DOWN", responseTimeMs, statusCode);
        } catch (Exception e) {
            log.error("Failed to publish monitor check for {}", monitor.getName(), e);
        }
    }
}
