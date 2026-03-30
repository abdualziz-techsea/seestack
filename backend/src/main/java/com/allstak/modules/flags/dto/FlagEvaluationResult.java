package com.allstak.modules.flags.dto;

import org.jspecify.annotations.NullMarked;

@NullMarked
public record FlagEvaluationResult(
        String flagKey,
        String variant,
        boolean enabled,
        String reason
) {}
