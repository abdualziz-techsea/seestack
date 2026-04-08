package com.seestack.modules.alerts.dto;

import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;

import java.time.Instant;
import java.util.UUID;

@NullMarked
public record AlertTriggerEvent(
        UUID projectId,
        String projectName,
        String triggerType,
        String severity,
        String title,
        String description,
        @Nullable String deepLinkUrl,
        Instant triggeredAt
) {}
