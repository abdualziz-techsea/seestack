package com.seestack.ingestion.kafka;

import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Kafka message payload for seestack.errors topic.
 */
@NullMarked
public record ErrorKafkaEvent(
        UUID eventId,
        UUID projectId,
        String fingerprint,
        String exceptionClass,
        String message,
        @Nullable List<String> stackTrace,
        @Nullable String level,
        @Nullable String environment,
        @Nullable String release,
        @Nullable String userId,
        @Nullable String userEmail,
        @Nullable String userIp,
        @Nullable Map<String, Object> metadata,
        long timestampMillis
) {}
