package com.allstak.modules.cron.dto;

import org.jspecify.annotations.NullMarked;
import java.time.Instant;
import java.util.UUID;

@NullMarked
public record CronPingResponse(
        UUID id,
        String status,
        long durationMs,
        String message,
        Instant timestamp
) {}
