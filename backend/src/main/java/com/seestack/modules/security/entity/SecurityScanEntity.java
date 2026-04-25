package com.seestack.modules.security.entity;

import jakarta.persistence.*;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "security_scans")
@NullMarked
public class SecurityScanEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Nullable
    @Column(name = "project_id")
    private UUID projectId;

    @Column(nullable = false, length = 255)
    private String target;

    @Nullable
    @Column(name = "resolved_host", length = 255)
    private String resolvedHost;

    @Column(name = "scanned_ports", nullable = false, columnDefinition = "TEXT")
    private String scannedPorts = "";

    @Column(name = "open_ports", nullable = false, columnDefinition = "TEXT")
    private String openPorts = "";

    @Column(name = "closed_ports", nullable = false, columnDefinition = "TEXT")
    private String closedPorts = "";

    @Column(nullable = false, length = 50)
    private String status = "pending";

    @Nullable
    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Nullable
    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "detected_services", nullable = false, columnDefinition = "TEXT")
    private String detectedServices = "{}";

    @Column(name = "http_info", nullable = false, columnDefinition = "TEXT")
    private String httpInfo = "{}";

    @Column(name = "security_headers", nullable = false, columnDefinition = "TEXT")
    private String securityHeaders = "{}";

    @Column(name = "risk_score", nullable = false)
    private int riskScore = 0;

    @Column(name = "risk_level", nullable = false, length = 20)
    private String riskLevel = "LOW";

    @Nullable
    @Column(columnDefinition = "TEXT")
    private String summary;

    protected SecurityScanEntity() {}

    public SecurityScanEntity(@Nullable UUID projectId, String target, String scannedPorts) {
        this.projectId = projectId;
        this.target = target;
        this.scannedPorts = scannedPorts;
    }

    public UUID getId() { return id; }
    public @Nullable UUID getProjectId() { return projectId; }
    public String getTarget() { return target; }
    public @Nullable String getResolvedHost() { return resolvedHost; }
    public String getScannedPorts() { return scannedPorts; }
    public String getOpenPorts() { return openPorts; }
    public String getClosedPorts() { return closedPorts; }
    public String getStatus() { return status; }
    public @Nullable String getErrorMessage() { return errorMessage; }
    public Instant getCreatedAt() { return createdAt; }
    public @Nullable Instant getCompletedAt() { return completedAt; }
    public String getDetectedServices() { return detectedServices; }
    public String getHttpInfo() { return httpInfo; }
    public String getSecurityHeaders() { return securityHeaders; }
    public int getRiskScore() { return riskScore; }
    public String getRiskLevel() { return riskLevel; }
    public @Nullable String getSummary() { return summary; }

    public void complete(String resolvedHost, String openPorts, String closedPorts) {
        this.resolvedHost = resolvedHost;
        this.openPorts = openPorts;
        this.closedPorts = closedPorts;
        this.status = "completed";
        this.completedAt = Instant.now();
    }

    public void setAnalysis(String detectedServices, String httpInfo, String securityHeaders,
                            int riskScore, String riskLevel, String summary) {
        this.detectedServices = detectedServices;
        this.httpInfo = httpInfo;
        this.securityHeaders = securityHeaders;
        this.riskScore = riskScore;
        this.riskLevel = riskLevel;
        this.summary = summary;
    }

    public void fail(String errorMessage) {
        this.errorMessage = errorMessage;
        this.status = "failed";
        this.completedAt = Instant.now();
    }
}
