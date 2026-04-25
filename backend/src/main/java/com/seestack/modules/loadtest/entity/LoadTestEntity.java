package com.seestack.modules.loadtest.entity;

import jakarta.persistence.*;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "load_tests")
@NullMarked
public class LoadTestEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Nullable
    @Column(name = "monitor_id")
    private UUID monitorId;

    @Column(name = "target_url", nullable = false, columnDefinition = "TEXT")
    private String targetUrl;

    @Column(name = "requested_count", nullable = false)
    private int requestedCount;

    @Column(nullable = false)
    private int concurrency;

    @Column(nullable = false, length = 50)
    private String status = "pending";

    @Column(name = "total_requests", nullable = false)
    private int totalRequests = 0;

    @Column(name = "successful_requests", nullable = false)
    private int successfulRequests = 0;

    @Column(name = "failed_requests", nullable = false)
    private int failedRequests = 0;

    @Column(name = "avg_response_time_ms", nullable = false)
    private double avgResponseTimeMs = 0;

    @Column(name = "min_response_time_ms", nullable = false)
    private int minResponseTimeMs = 0;

    @Column(name = "max_response_time_ms", nullable = false)
    private int maxResponseTimeMs = 0;

    @Column(name = "p95_response_time_ms", nullable = false)
    private int p95ResponseTimeMs = 0;

    @Column(name = "status_code_distribution", nullable = false, columnDefinition = "TEXT")
    private String statusCodeDistribution = "{}";

    @Nullable
    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Nullable
    @Column(name = "completed_at")
    private Instant completedAt;

    protected LoadTestEntity() {}

    public LoadTestEntity(UUID projectId, @Nullable UUID monitorId, String targetUrl,
                          int requestedCount, int concurrency) {
        this.projectId = projectId;
        this.monitorId = monitorId;
        this.targetUrl = targetUrl;
        this.requestedCount = requestedCount;
        this.concurrency = concurrency;
    }

    public UUID getId() { return id; }
    public UUID getProjectId() { return projectId; }
    public @Nullable UUID getMonitorId() { return monitorId; }
    public String getTargetUrl() { return targetUrl; }
    public int getRequestedCount() { return requestedCount; }
    public int getConcurrency() { return concurrency; }
    public String getStatus() { return status; }
    public int getTotalRequests() { return totalRequests; }
    public int getSuccessfulRequests() { return successfulRequests; }
    public int getFailedRequests() { return failedRequests; }
    public double getAvgResponseTimeMs() { return avgResponseTimeMs; }
    public int getMinResponseTimeMs() { return minResponseTimeMs; }
    public int getMaxResponseTimeMs() { return maxResponseTimeMs; }
    public int getP95ResponseTimeMs() { return p95ResponseTimeMs; }
    public String getStatusCodeDistribution() { return statusCodeDistribution; }
    public @Nullable String getErrorMessage() { return errorMessage; }
    public Instant getCreatedAt() { return createdAt; }
    public @Nullable Instant getCompletedAt() { return completedAt; }

    public void complete(int total, int success, int failed,
                         double avg, int min, int max, int p95,
                         String statusDistJson) {
        this.totalRequests = total;
        this.successfulRequests = success;
        this.failedRequests = failed;
        this.avgResponseTimeMs = avg;
        this.minResponseTimeMs = min;
        this.maxResponseTimeMs = max;
        this.p95ResponseTimeMs = p95;
        this.statusCodeDistribution = statusDistJson;
        this.status = "completed";
        this.completedAt = Instant.now();
    }

    public void fail(String error) {
        this.errorMessage = error;
        this.status = "failed";
        this.completedAt = Instant.now();
    }
}
