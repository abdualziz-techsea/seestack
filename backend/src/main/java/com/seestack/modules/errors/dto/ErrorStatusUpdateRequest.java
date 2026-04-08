package com.seestack.modules.errors.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import org.jspecify.annotations.NullMarked;

import java.util.UUID;

@NullMarked
public record ErrorStatusUpdateRequest(
        @NotNull UUID projectId,
        @NotNull @Pattern(regexp = "unresolved|resolved|ignored") String status
) {}
