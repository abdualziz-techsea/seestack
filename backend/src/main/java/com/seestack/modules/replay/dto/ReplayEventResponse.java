package com.seestack.modules.replay.dto;

import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;

import java.time.Instant;

@NullMarked
public record ReplayEventResponse(
        String eventType,
        String eventData,
        @Nullable String url,
        Instant timestamp
) {}
