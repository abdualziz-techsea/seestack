package com.seestack.modules.teams.entity;

import jakarta.persistence.*;
import org.jspecify.annotations.NullMarked;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "project_members")
@NullMarked
public class ProjectMemberEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "can_errors", nullable = false)
    private boolean canErrors;

    @Column(name = "can_logs", nullable = false)
    private boolean canLogs;

    @Column(name = "can_monitors", nullable = false)
    private boolean canMonitors;

    @Column(name = "can_ssh", nullable = false)
    private boolean canSsh;

    @Column(name = "can_requests", nullable = false)
    private boolean canRequests;

    @Column(name = "can_flags", nullable = false)
    private boolean canFlags;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected ProjectMemberEntity() {}

    public ProjectMemberEntity(UUID projectId, UUID userId,
                                boolean canErrors, boolean canLogs,
                                boolean canMonitors, boolean canSsh) {
        this.projectId = projectId;
        this.userId = userId;
        this.canErrors = canErrors;
        this.canLogs = canLogs;
        this.canMonitors = canMonitors;
        this.canSsh = canSsh;
    }

    public UUID getId() { return id; }
    public UUID getProjectId() { return projectId; }
    public UUID getUserId() { return userId; }
    public boolean isCanErrors() { return canErrors; }
    public boolean isCanLogs() { return canLogs; }
    public boolean isCanMonitors() { return canMonitors; }
    public boolean isCanSsh() { return canSsh; }
    public boolean isCanRequests() { return canRequests; }
    public boolean isCanFlags() { return canFlags; }
    public Instant getCreatedAt() { return createdAt; }

    public void updatePermissions(boolean canErrors, boolean canLogs,
                                   boolean canMonitors, boolean canSsh) {
        this.canErrors = canErrors;
        this.canLogs = canLogs;
        this.canMonitors = canMonitors;
        this.canSsh = canSsh;
    }

    public boolean hasPermission(String permission) {
        return switch (permission) {
            case "errors" -> canErrors;
            case "logs" -> canLogs;
            case "monitors" -> canMonitors;
            case "ssh" -> canSsh;
            case "requests" -> canRequests;
            case "flags" -> canFlags;
            default -> false;
        };
    }
}
