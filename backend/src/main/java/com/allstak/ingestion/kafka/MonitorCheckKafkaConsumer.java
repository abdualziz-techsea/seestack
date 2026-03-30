package com.allstak.ingestion.kafka;

import com.allstak.ingestion.clickhouse.MonitorCheckClickHouseWriter;
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
public class MonitorCheckKafkaConsumer {

    private static final Logger log = LoggerFactory.getLogger(MonitorCheckKafkaConsumer.class);

    private final MonitorCheckClickHouseWriter clickHouseWriter;
    private final ObjectMapper objectMapper;

    public MonitorCheckKafkaConsumer(MonitorCheckClickHouseWriter clickHouseWriter,
                                     ObjectMapper objectMapper) {
        this.clickHouseWriter = clickHouseWriter;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(topics = "allstak.monitor-checks", groupId = "allstak-consumers", concurrency = "1")
    public void consume(@Payload String payload,
                        @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
                        Acknowledgment ack) {
        MonitorCheckKafkaEvent event = null;
        try {
            event = objectMapper.readValue(payload, MonitorCheckKafkaEvent.class);
            clickHouseWriter.write(event);
            ack.acknowledge();
            log.debug("Processed monitor check for {} (partition={})", event.monitorId(), partition);
        } catch (Exception e) {
            String id = event != null ? event.monitorId().toString() : "unknown";
            log.error("Failed to process monitor check {} from partition {}", id, partition, e);
        }
    }
}
