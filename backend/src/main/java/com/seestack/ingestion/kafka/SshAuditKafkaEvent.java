package com.seestack.ingestion.kafka;

import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;

import java.util.UUID;

/**
 * Kafka message payload for seestack.ssh-audit topic.
 */
@NullMarked
public record SshAuditKafkaEvent(
        UUID serverId,
        UUID projectId,
        UUID userId,
        @Nullable String command,
        @Nullable String output,
        long timestampMillis
) {}
