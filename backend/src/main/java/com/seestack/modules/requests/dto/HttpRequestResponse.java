package com.seestack.modules.requests.dto;

import org.jspecify.annotations.NullMarked;
import java.time.Instant;
import java.util.UUID;

@NullMarked
public record HttpRequestResponse(
        UUID id,
        String traceId,
        String direction,
        String method,
        String host,
        String path,
        int statusCode,
        int durationMs,
        boolean isSlow,
        String userId,
        String errorFingerprint,
        Instant timestamp
) {}
