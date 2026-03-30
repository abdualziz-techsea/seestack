package com.allstak.modules.replay.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;

import java.util.List;

@NullMarked
public record ReplayIngestRequest(
        @NotBlank String fingerprint,
        @NotBlank String sessionId,
        @NotEmpty List<ReplayEventItem> events
) {
    public record ReplayEventItem(
            @NotBlank String eventType,
            @NotBlank String eventData,
            @Nullable String url,
            long timestampMillis
    ) {}
}
