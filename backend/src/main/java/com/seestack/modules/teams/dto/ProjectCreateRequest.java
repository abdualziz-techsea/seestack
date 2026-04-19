package com.seestack.modules.teams.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;

@NullMarked
public record ProjectCreateRequest(
        @NotBlank @Size(max = 255) String name,
        @Nullable String platform
) {}
