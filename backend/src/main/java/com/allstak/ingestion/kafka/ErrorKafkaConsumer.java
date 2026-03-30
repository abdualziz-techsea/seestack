package com.allstak.ingestion.kafka;

import com.allstak.ingestion.clickhouse.ErrorClickHouseWriter;
import com.allstak.modules.errors.service.ErrorGroupService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.jspecify.annotations.NullMarked;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
@NullMarked
public class ErrorKafkaConsumer {

    private static final Logger log = LoggerFactory.getLogger(ErrorKafkaConsumer.class);

    private final ErrorClickHouseWriter clickHouseWriter;
    private final ErrorGroupService errorGroupService;
    private final ObjectMapper objectMapper;

    public ErrorKafkaConsumer(ErrorClickHouseWriter clickHouseWriter,
                              ErrorGroupService errorGroupService,
                              ObjectMapper objectMapper) {
        this.clickHouseWriter = clickHouseWriter;
        this.errorGroupService = errorGroupService;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(topics = "allstak.errors", groupId = "allstak-consumers", concurrency = "3")
    public void consume(@Payload String payload,
                        @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
                        Acknowledgment ack) {
        ErrorKafkaEvent event = null;
        try {
            event = objectMapper.readValue(payload, ErrorKafkaEvent.class);

            clickHouseWriter.write(event);

            String title = truncate(event.message(), 500);
            Instant timestamp = Instant.ofEpochMilli(event.timestampMillis());
            errorGroupService.upsert(
                    event.projectId(),
                    event.fingerprint(),
                    event.exceptionClass(),
                    title,
                    event.level(),
                    event.environment(),
                    timestamp
            );

            ack.acknowledge();
            log.debug("Processed error event {} (partition={})", event.eventId(), partition);

        } catch (Exception e) {
            String id = event != null ? event.eventId().toString() : "unknown";
            log.error("Failed to process error event {} from partition {}", id, partition, e);
        }
    }

    private String truncate(String value, int maxLength) {
        return value.length() <= maxLength ? value : value.substring(0, maxLength);
    }
}
