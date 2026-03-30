package com.allstak.modules.flags.dto;

import org.jspecify.annotations.NullMarked;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@NullMarked
public record FlagResponse(
        UUID id,
        String key,
        String name,
        String description,
        String type,
        String defaultValue,
        int rolloutPercent,
        List<TargetingRuleDto> rules,
        boolean isActive,
        Instant createdAt,
        Instant updatedAt
) {}
