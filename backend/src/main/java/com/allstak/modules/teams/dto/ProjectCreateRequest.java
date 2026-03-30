package com.allstak.modules.teams.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;

import java.util.UUID;

@NullMarked
public record ProjectCreateRequest(
        @NotNull UUID orgId,
        @NotBlank String name,
        @NotBlank @Pattern(regexp = "[a-z0-9-]+", message = "slug must be lowercase alphanumeric with hyphens") String slug,
        @Nullable String platform
) {}
