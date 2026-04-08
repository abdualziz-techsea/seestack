package com.seestack.ingestion.kafka;

import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;

import java.util.Map;
import java.util.UUID;

/**
 * Kafka message payload for seestack.logs topic.
 */
@NullMarked
public record LogKafkaEvent(
        UUID eventId,
        UUID projectId,
        String level,
        String message,
        @Nullable String service,
        @Nullable String traceId,
        @Nullable Map<String, Object> metadata,
        long timestampMillis
) {}
