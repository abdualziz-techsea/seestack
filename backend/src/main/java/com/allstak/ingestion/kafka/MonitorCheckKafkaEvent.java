package com.allstak.ingestion.kafka;

import org.jspecify.annotations.NullMarked;

import java.util.UUID;

/**
 * Kafka message payload for allstak.monitor-checks topic.
 */
@NullMarked
public record MonitorCheckKafkaEvent(
        UUID monitorId,
        UUID projectId,
        int status,
        int responseTimeMs,
        int statusCode,
        long timestampMillis
) {}
