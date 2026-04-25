package com.seestack.modules.loadtest.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.seestack.modules.loadtest.entity.LoadTestEntity;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@NullMarked
public record LoadTestResponse(
        UUID id,
        UUID projectId,
        @Nullable UUID monitorId,
        String targetUrl,
        int requestedCount,
        int concurrency,
        String status,
        int totalRequests,
        int successfulRequests,
        int failedRequests,
        double avgResponseTimeMs,
        int minResponseTimeMs,
        int maxResponseTimeMs,
        int p95ResponseTimeMs,
        Map<String, Integer> statusCodeDistribution,
        @Nullable String errorMessage,
        String testType,
        Instant createdAt,
        @Nullable Instant completedAt
) {
    public static LoadTestResponse from(LoadTestEntity e, ObjectMapper objectMapper) {
        Map<String, Integer> dist = new LinkedHashMap<>();
        try {
            @SuppressWarnings("unchecked")
            Map<String, Integer> parsed = objectMapper.readValue(e.getStatusCodeDistribution(), Map.class);
            dist = parsed;
        } catch (Exception ignored) {}

        return new LoadTestResponse(
                e.getId(),
                e.getProjectId(),
                e.getMonitorId(),
                e.getTargetUrl(),
                e.getRequestedCount(),
                e.getConcurrency(),
                e.getStatus(),
                e.getTotalRequests(),
                e.getSuccessfulRequests(),
                e.getFailedRequests(),
                e.getAvgResponseTimeMs(),
                e.getMinResponseTimeMs(),
                e.getMaxResponseTimeMs(),
                e.getP95ResponseTimeMs(),
                dist,
                e.getErrorMessage(),
                "Basic Load Test",
                e.getCreatedAt(),
                e.getCompletedAt()
        );
    }
}
