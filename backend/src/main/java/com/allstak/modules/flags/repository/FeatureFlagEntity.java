package com.allstak.modules.flags.repository;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "feature_flags", uniqueConstraints = @UniqueConstraint(columnNames = {"project_id", "key"}))
@NullMarked
public class FeatureFlagEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "key", nullable = false)
    private String key;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description = "";

    @Column(nullable = false, length = 50)
    private String type = "boolean";

    @Column(name = "default_value", nullable = false, columnDefinition = "TEXT")
    private String defaultValue = "false";

    @Column(name = "rollout_percent", nullable = false)
    private int rolloutPercent = 0;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "JSONB")
    private String rules = "[]";

    @Column(name = "is_active", nullable = false)
    private boolean active = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    protected FeatureFlagEntity() {}

    public FeatureFlagEntity(UUID projectId, String key, String name, String description,
                              String type, String defaultValue, int rolloutPercent, String rules) {
        this.projectId = projectId;
        this.key = key;
        this.name = name;
        this.description = description != null ? description : "";
        this.type = type;
        this.defaultValue = defaultValue;
        this.rolloutPercent = rolloutPercent;
        this.rules = rules;
    }

    public UUID getId() { return id; }
    public UUID getProjectId() { return projectId; }
    public String getKey() { return key; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public String getType() { return type; }
    public String getDefaultValue() { return defaultValue; }
    public int getRolloutPercent() { return rolloutPercent; }
    public String getRules() { return rules; }
    public boolean isActive() { return active; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }

    public void update(String name, @Nullable String description, String type,
                       String defaultValue, int rolloutPercent, String rules) {
        this.name = name;
        if (description != null) this.description = description;
        this.type = type;
        this.defaultValue = defaultValue;
        this.rolloutPercent = rolloutPercent;
        this.rules = rules;
        this.updatedAt = Instant.now();
    }

    public void toggleActive() {
        this.active = !this.active;
        this.updatedAt = Instant.now();
    }
}
