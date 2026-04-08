package com.seestack.ingestion.kafka;

import com.seestack.ingestion.clickhouse.SshAuditClickHouseWriter;
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
public class SshAuditKafkaConsumer {

    private static final Logger log = LoggerFactory.getLogger(SshAuditKafkaConsumer.class);

    private final SshAuditClickHouseWriter clickHouseWriter;
    private final ObjectMapper objectMapper;

    public SshAuditKafkaConsumer(SshAuditClickHouseWriter clickHouseWriter,
                                  ObjectMapper objectMapper) {
        this.clickHouseWriter = clickHouseWriter;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(topics = "seestack.ssh-audit", groupId = "seestack-consumers", concurrency = "1")
    public void consume(@Payload String payload,
                        @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
                        Acknowledgment ack) {
        SshAuditKafkaEvent event = null;
        try {
            event = objectMapper.readValue(payload, SshAuditKafkaEvent.class);
            clickHouseWriter.write(event);
            ack.acknowledge();
            log.debug("Processed SSH audit log for server {} (partition={})", event.serverId(), partition);
        } catch (Exception e) {
            String id = event != null ? event.serverId().toString() : "unknown";
            log.error("Failed to process SSH audit log {} from partition {}", id, partition, e);
        }
    }
}
