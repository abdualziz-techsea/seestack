package com.seestack.modules.requests.dto;

import org.jspecify.annotations.NullMarked;

@NullMarked
public record TopHostEntry(
        String host,
        long totalRequests,
        long failedRequests,
        double failureRate,
        long avgDurationMs
) {}
