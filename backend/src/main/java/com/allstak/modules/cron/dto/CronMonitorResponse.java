package com.allstak.modules.cron.dto;

import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;
import java.time.Instant;
import java.util.UUID;

@NullMarked
public record CronMonitorResponse(
        UUID id,
        String name,
        String slug,
        String schedule,
        int gracePeriodMin,
        boolean isActive,
        String currentStatus,
        @Nullable Instant lastPingAt,
        @Nullable Instant nextExpectedAt,
        long lastDurationMs,
        @Nullable String lastMessage,
        Instant createdAt
) {}
