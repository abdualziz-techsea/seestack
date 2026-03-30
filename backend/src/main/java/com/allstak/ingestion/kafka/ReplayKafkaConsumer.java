package com.allstak.ingestion.kafka;

import com.allstak.ingestion.clickhouse.ReplayClickHouseWriter;
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
public class ReplayKafkaConsumer {

    private static final Logger log = LoggerFactory.getLogger(ReplayKafkaConsumer.class);

    private final ReplayClickHouseWriter clickHouseWriter;
    private final ObjectMapper objectMapper;

    public ReplayKafkaConsumer(ReplayClickHouseWriter clickHouseWriter, ObjectMapper objectMapper) {
        this.clickHouseWriter = clickHouseWriter;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(topics = "allstak.replay", groupId = "allstak-consumers", concurrency = "2")
    public void consume(@Payload String payload,
                        @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
                        Acknowledgment ack) {
        ReplayKafkaEvent event = null;
        try {
            event = objectMapper.readValue(payload, ReplayKafkaEvent.class);
            clickHouseWriter.write(event);
            ack.acknowledge();
            log.debug("Processed {} replay events for fingerprint {} (partition={})",
                    event.events().size(), event.fingerprint(), partition);
        } catch (Exception e) {
            String fp = event != null ? event.fingerprint() : "unknown";
            log.error("Failed to process replay events for {} from partition {}", fp, partition, e);
        }
    }
}
