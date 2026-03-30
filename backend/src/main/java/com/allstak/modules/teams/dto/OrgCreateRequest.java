package com.allstak.modules.teams.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import org.jspecify.annotations.NullMarked;

@NullMarked
public record OrgCreateRequest(
        @NotBlank String name,
        @NotBlank @Pattern(regexp = "[a-z0-9-]+", message = "slug must be lowercase alphanumeric with hyphens") String slug
) {}
