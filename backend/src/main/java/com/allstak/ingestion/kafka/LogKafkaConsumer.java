package com.allstak.ingestion.kafka;

import com.allstak.ingestion.clickhouse.LogClickHouseWriter;
import com.allstak.modules.logs.service.LogTailBroadcaster;
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

@Component
@NullMarked
public class LogKafkaConsumer {

    private static final Logger log = LoggerFactory.getLogger(LogKafkaConsumer.class);

    private final LogClickHouseWriter clickHouseWriter;
    private final LogTailBroadcaster tailBroadcaster;
    private final ObjectMapper objectMapper;

    public LogKafkaConsumer(LogClickHouseWriter clickHouseWriter,
                            LogTailBroadcaster tailBroadcaster,
                            ObjectMapper objectMapper) {
        this.clickHouseWriter = clickHouseWriter;
        this.tailBroadcaster = tailBroadcaster;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(topics = "allstak.logs", groupId = "allstak-consumers", concurrency = "3")
    public void consume(@Payload String payload,
                        @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
                        Acknowledgment ack) {
        LogKafkaEvent event = null;
        try {
            event = objectMapper.readValue(payload, LogKafkaEvent.class);

            clickHouseWriter.write(event);
            tailBroadcaster.broadcast(event);

            ack.acknowledge();
            log.debug("Processed log event {} (partition={})", event.eventId(), partition);

        } catch (Exception e) {
            String id = event != null ? event.eventId().toString() : "unknown";
            log.error("Failed to process log event {} from partition {}", id, partition, e);
        }
    }
}
