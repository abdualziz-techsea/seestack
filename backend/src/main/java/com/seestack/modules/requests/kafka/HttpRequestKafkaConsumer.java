package com.seestack.modules.requests.kafka;

import com.seestack.modules.requests.writer.HttpRequestClickHouseWriter;
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
public class HttpRequestKafkaConsumer {

    private static final Logger log = LoggerFactory.getLogger(HttpRequestKafkaConsumer.class);

    private final ObjectMapper objectMapper;
    private final HttpRequestClickHouseWriter writer;

    public HttpRequestKafkaConsumer(ObjectMapper objectMapper, HttpRequestClickHouseWriter writer) {
        this.objectMapper = objectMapper;
        this.writer = writer;
    }

    @KafkaListener(topics = "seestack.http_requests", groupId = "seestack-http-requests-consumer", concurrency = "3")
    public void consume(@Payload String payload,
                        @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
                        Acknowledgment ack) {
        try {
            HttpRequestKafkaEvent event = objectMapper.readValue(payload, HttpRequestKafkaEvent.class);
            writer.write(event);
            ack.acknowledge();
        } catch (Exception e) {
            log.error("Failed to process http_request event from partition {}", partition, e);
        }
    }
}
