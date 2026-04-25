package com.seestack.modules.ai.dto;

import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;

import java.time.Instant;
import java.util.List;

@NullMarked
public record AiAnalysisResponse(
        String explanation,
        String rootCause,
        List<String> fixSteps,
        List<String> prevention,
        String severity,
        String confidence,
        String model,
        boolean configured,
        boolean cached,
        @Nullable Instant generatedAt
) {}
