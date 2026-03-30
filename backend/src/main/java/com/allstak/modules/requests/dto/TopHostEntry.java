package com.allstak.modules.requests.dto;

import org.jspecify.annotations.NullMarked;

@NullMarked
public record TopHostEntry(
        String host,
        long totalRequests,
        long failedRequests,
        double failureRate,
        long avgDurationMs
) {}
