package com.allstak.modules.cron.kafka;

import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;
import java.util.UUID;

@NullMarked
public record CronPingKafkaEvent(
        UUID monitorId,
        UUID projectId,
        String status,
        long durationMs,
        @Nullable String message,
        long timestampMillis
) {}
