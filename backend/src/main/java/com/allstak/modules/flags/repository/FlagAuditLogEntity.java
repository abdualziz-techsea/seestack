package com.allstak.modules.flags.repository;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "flag_audit_log")
@NullMarked
public class FlagAuditLogEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "flag_id")
    private UUID flagId;

    @Column(name = "project_id")
    private UUID projectId;

    @Nullable
    @Column(name = "user_id")
    private UUID userId;

    @Column(nullable = false, length = 50)
    private String action;

    @Nullable
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "JSONB")
    private String oldValue;

    @Nullable
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "JSONB")
    private String newValue;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected FlagAuditLogEntity() {}

    public FlagAuditLogEntity(UUID flagId, UUID projectId, @Nullable UUID userId,
                               String action, @Nullable String oldValue, @Nullable String newValue) {
        this.flagId = flagId;
        this.projectId = projectId;
        this.userId = userId;
        this.action = action;
        this.oldValue = oldValue;
        this.newValue = newValue;
    }

    public UUID getId() { return id; }
    public UUID getFlagId() { return flagId; }
    public UUID getProjectId() { return projectId; }
    public @Nullable UUID getUserId() { return userId; }
    public String getAction() { return action; }
    public @Nullable String getOldValue() { return oldValue; }
    public @Nullable String getNewValue() { return newValue; }
    public Instant getCreatedAt() { return createdAt; }
}
