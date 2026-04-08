package com.seestack.modules.flags.dto;

import jakarta.validation.constraints.*;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;
import java.util.List;
import java.util.UUID;

@NullMarked
public record CreateFlagRequest(
        @NotNull UUID projectId,
        @NotBlank @Pattern(regexp = "^[a-z0-9\\-]+$", message = "key must be lowercase alphanumeric with hyphens only") String key,
        @NotBlank String name,
        @Nullable String description,
        @NotBlank @Pattern(regexp = "boolean|string|number", message = "type must be boolean, string, or number") String type,
        @NotBlank String defaultValue,
        @Min(0) @Max(100) int rolloutPercent,
        @Nullable List<TargetingRuleDto> rules
) {}
