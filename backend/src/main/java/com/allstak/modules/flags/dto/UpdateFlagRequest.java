package com.allstak.modules.flags.dto;

import jakarta.validation.constraints.*;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;
import java.util.List;
import java.util.UUID;

@NullMarked
public record UpdateFlagRequest(
        @NotNull UUID projectId,
        @NotBlank String name,
        @Nullable String description,
        @NotBlank String type,
        @NotBlank String defaultValue,
        @Min(0) @Max(100) int rolloutPercent,
        @Nullable List<TargetingRuleDto> rules
) {}
