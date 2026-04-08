package com.seestack.modules.logs.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;

import java.util.Map;

@NullMarked
public record LogIngestRequest(
        @NotBlank @Pattern(regexp = "debug|info|warn|error|fatal") String level,
        @NotBlank String message,
        @Nullable String service,
        @Nullable String traceId,
        @Nullable Map<String, Object> metadata
) {}
