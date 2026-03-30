package com.allstak.modules.cron.scheduler;

import com.allstak.modules.alerts.service.AlertEvaluationService;
import com.allstak.modules.cron.dto.CronPingResponse;
import com.allstak.modules.cron.entity.CronMonitorEntity;
import com.allstak.modules.cron.kafka.CronPingKafkaEvent;
import com.allstak.modules.cron.service.CronMonitorService;
import com.allstak.modules.cron.service.CronPingQueryService;
import com.allstak.modules.cron.service.CronScheduleParser;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.jspecify.annotations.NullMarked;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

@Component
@NullMarked
public class CronEvaluatorScheduler {

    private static final Logger log = LoggerFactory.getLogger(CronEvaluatorScheduler.class);
    private static final String TOPIC = "allstak.cron_pings";

    private final CronMonitorService monitorService;
    private final CronPingQueryService pingQueryService;
    private final CronScheduleParser scheduleParser;
    private final AlertEvaluationService alertEvaluation;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public CronEvaluatorScheduler(CronMonitorService monitorService,
                                   CronPingQueryService pingQueryService,
                                   CronScheduleParser scheduleParser,
                                   AlertEvaluationService alertEvaluation,
                                   KafkaTemplate<String, String> kafkaTemplate,
                                   ObjectMapper objectMapper) {
        this.monitorService = monitorService;
        this.pingQueryService = pingQueryService;
        this.scheduleParser = scheduleParser;
        this.alertEvaluation = alertEvaluation;
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
    }

    @Scheduled(fixedDelay = 60_000)
    public void evaluate() {
        List<CronMonitorEntity> activeMonitors = monitorService.findAllActive();

        for (CronMonitorEntity monitor : activeMonitors) {
            try {
                CronPingResponse lastPing = pingQueryService.findLastPing(monitor.getId());
                String status = monitorService.resolveStatus(monitor, lastPing);

                if ("missed".equals(status)) {
                    Instant windowStart = lastPing != null
                            ? scheduleParser.computeNextExpectedAt(lastPing.timestamp(), monitor.getCreatedAt(), monitor.getSchedule())
                            : monitor.getCreatedAt();

                    boolean alreadyRecorded = pingQueryService.hasMissedPingAfter(monitor.getId(), windowStart);
                    if (!alreadyRecorded) {
                        publishMissedPing(monitor);
                        alertEvaluation.evaluateJobMissed(monitor.getId(), monitor.getProjectId(), monitor.getName());
                    }
                }

                // Duration spike check
                if (lastPing != null && lastPing.durationMs() > 0 && "success".equals(lastPing.status())) {
                    double avgDuration = pingQueryService.avgDurationLastN(monitor.getId(), 10);
                    if (avgDuration > 0 && lastPing.durationMs() > avgDuration * 1.5) {
                        alertEvaluation.evaluateJobDurationSpike(
                                monitor.getId(), monitor.getProjectId(), monitor.getName(),
                                lastPing.durationMs(), (long) avgDuration);
                    }
                }
            } catch (Exception e) {
                log.error("Failed to evaluate cron monitor {}", monitor.getId(), e);
            }
        }
    }

    private void publishMissedPing(CronMonitorEntity monitor) {
        var event = new CronPingKafkaEvent(
                monitor.getId(), monitor.getProjectId(),
                "missed", 0, "Job did not ping within grace period",
                System.currentTimeMillis()
        );
        try {
            kafkaTemplate.send(TOPIC, monitor.getId().toString(), objectMapper.writeValueAsString(event));
        } catch (Exception e) {
            log.error("Failed to publish missed ping for monitor {}", monitor.getId(), e);
        }
    }
}
