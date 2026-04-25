package com.seestack.modules.security.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;

import java.util.UUID;

@NullMarked
public record SecurityScanCreateRequest(
        @NotBlank @Size(max = 255) String target,
        @Nullable UUID projectId
) {}
