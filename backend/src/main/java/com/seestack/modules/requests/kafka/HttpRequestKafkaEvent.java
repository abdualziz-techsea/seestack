package com.seestack.modules.requests.kafka;

import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;
import java.util.UUID;

@NullMarked
public record HttpRequestKafkaEvent(
        UUID projectId,
        String traceId,
        String direction,
        String method,
        String host,
        String path,
        int statusCode,
        int durationMs,
        int requestSize,
        int responseSize,
        @Nullable String userId,
        @Nullable String errorFingerprint,
        int isSlow,
        long timestampMillis
) {}
