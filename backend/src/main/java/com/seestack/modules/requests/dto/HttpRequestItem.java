package com.seestack.modules.requests.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Min;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;

@NullMarked
public record HttpRequestItem(
        @NotBlank String traceId,
        @NotBlank String direction,
        @NotBlank String method,
        @NotBlank String host,
        @NotBlank String path,
        int statusCode,
        @Min(0) int durationMs,
        int requestSize,
        int responseSize,
        @Nullable String userId,
        @Nullable String errorFingerprint,
        @NotBlank String timestamp
) {}
