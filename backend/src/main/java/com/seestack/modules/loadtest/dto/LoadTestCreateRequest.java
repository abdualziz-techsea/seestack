package com.seestack.modules.loadtest.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import org.jspecify.annotations.NullMarked;

import java.util.UUID;

@NullMarked
public record LoadTestCreateRequest(
        @NotNull UUID projectId,
        @NotNull UUID monitorId,
        @Min(1) @Max(100) int requests,
        @Min(1) @Max(10)  int concurrency
) {}
