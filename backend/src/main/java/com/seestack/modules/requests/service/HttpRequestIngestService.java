package com.seestack.modules.requests.service;

import com.seestack.modules.requests.dto.HttpRequestIngestRequest;
import com.seestack.modules.requests.dto.HttpRequestItem;
import com.seestack.modules.requests.kafka.HttpRequestKafkaEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.jspecify.annotations.NullMarked;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

@Service
@NullMarked
public class HttpRequestIngestService {

    private static final Logger log = LoggerFactory.getLogger(HttpRequestIngestService.class);
    private static final String TOPIC = "seestack.http_requests";
    private static final int SLOW_THRESHOLD_MS = 1000;
    private static final Set<String> VALID_DIRECTIONS = Set.of("inbound", "outbound");
    private static final Set<String> VALID_METHODS = Set.of("GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS");

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public HttpRequestIngestService(KafkaTemplate<String, String> kafkaTemplate, ObjectMapper objectMapper) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
    }

    public int ingest(UUID projectId, HttpRequestIngestRequest request) {
        int accepted = 0;
        for (HttpRequestItem item : request.requests()) {
            validate(item);

            int isSlow = item.durationMs() > SLOW_THRESHOLD_MS ? 1 : 0;
            long timestampMillis = Instant.parse(item.timestamp()).toEpochMilli();

            var event = new HttpRequestKafkaEvent(
                    projectId,
                    item.traceId(),
                    item.direction(),
                    item.method().toUpperCase(),
                    item.host(),
                    item.path(),
                    item.statusCode(),
                    item.durationMs(),
                    item.requestSize(),
                    item.responseSize(),
                    item.userId(),
                    item.errorFingerprint(),
                    isSlow,
                    timestampMillis
            );

            try {
                String json = objectMapper.writeValueAsString(event);
                kafkaTemplate.send(TOPIC, projectId.toString(), json);
                accepted++;
            } catch (Exception e) {
                log.error("Failed to publish http_request event to Kafka", e);
            }
        }
        return accepted;
    }

    private void validate(HttpRequestItem item) {
        if (!VALID_DIRECTIONS.contains(item.direction())) {
            throw new IllegalArgumentException("Invalid direction: " + item.direction() + ". Must be one of: " + VALID_DIRECTIONS);
        }
        if (!VALID_METHODS.contains(item.method().toUpperCase())) {
            throw new IllegalArgumentException("Invalid method: " + item.method() + ". Must be one of: " + VALID_METHODS);
        }
        if (item.statusCode() != 0 && (item.statusCode() < 100 || item.statusCode() > 599)) {
            throw new IllegalArgumentException("Invalid statusCode: " + item.statusCode() + ". Must be between 100-599 or 0");
        }
    }
}
