package com.allstak.modules.cron.kafka;

import com.allstak.modules.cron.writer.CronPingClickHouseWriter;
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
public class CronPingKafkaConsumer {

    private static final Logger log = LoggerFactory.getLogger(CronPingKafkaConsumer.class);

    private final ObjectMapper objectMapper;
    private final CronPingClickHouseWriter writer;

    public CronPingKafkaConsumer(ObjectMapper objectMapper, CronPingClickHouseWriter writer) {
        this.objectMapper = objectMapper;
        this.writer = writer;
    }

    @KafkaListener(topics = "allstak.cron_pings", groupId = "allstak-cron-pings-consumer", concurrency = "3")
    public void consume(@Payload String payload,
                        @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
                        Acknowledgment ack) {
        try {
            CronPingKafkaEvent event = objectMapper.readValue(payload, CronPingKafkaEvent.class);
            writer.write(event);
            ack.acknowledge();
        } catch (Exception e) {
            log.error("Failed to process cron_ping event from partition {}", partition, e);
        }
    }
}
