package com.seestack.ingestion.kafka;

import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;

import java.util.List;
import java.util.UUID;

/**
 * Kafka message payload for seestack.replay topic.
 */
@NullMarked
public record ReplayKafkaEvent(
        UUID projectId,
        String fingerprint,
        String sessionId,
        List<ReplayEventItem> events
) {
    public record ReplayEventItem(
            String eventType,
            String eventData,
            @Nullable String url,
            long timestampMillis
    ) {}
}
