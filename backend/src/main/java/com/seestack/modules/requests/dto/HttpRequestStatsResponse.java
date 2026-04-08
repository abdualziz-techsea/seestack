package com.seestack.modules.requests.dto;

import org.jspecify.annotations.NullMarked;

@NullMarked
public record HttpRequestStatsResponse(
        long totalRequests,
        double errorRate,
        double slowRate,
        long p50,
        long p95,
        long p99,
        long inboundCount,
        long outboundCount
) {}
