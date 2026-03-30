package com.allstak.modules.monitors.dto;

import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;

import java.time.Instant;
import java.util.UUID;

@NullMarked
public record MonitorListItemResponse(
        UUID id,
        UUID projectId,
        String name,
        String url,
        int intervalMinutes,
        boolean isActive,
        Instant createdAt,
        String status,
        int lastResponseTimeMs,
        double uptimePercentage,
        @Nullable Instant lastCheckedAt
) {}
