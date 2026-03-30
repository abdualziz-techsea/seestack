package com.allstak.modules.logs.dto;

import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;

import java.time.Instant;
import java.util.UUID;

@NullMarked
public record LogResponse(
        UUID id,
        UUID projectId,
        String level,
        String message,
        @Nullable String service,
        @Nullable String traceId,
        @Nullable String metadata,
        Instant timestamp
) {}
