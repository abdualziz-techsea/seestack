package com.seestack.modules.cron.dto;

import jakarta.validation.constraints.NotBlank;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;

@NullMarked
public record HeartbeatRequest(
        @NotBlank String slug,
        @NotBlank String status,
        long durationMs,
        @Nullable String message
) {}
