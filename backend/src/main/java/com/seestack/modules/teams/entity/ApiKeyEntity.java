package com.seestack.modules.teams.entity;

import jakarta.persistence.*;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "api_keys")
@NullMarked
public class ApiKeyEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "key_hash", nullable = false, unique = true)
    private String keyHash;

    @Column(name = "key_prefix", nullable = false, length = 20)
    private String keyPrefix = "";

    @Nullable
    @Column
    private String name;

    @Nullable
    @Column(name = "last_used_at")
    private Instant lastUsedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected ApiKeyEntity() {}

    public ApiKeyEntity(UUID projectId, String keyHash, String keyPrefix, @Nullable String name) {
        this.projectId = projectId;
        this.keyHash = keyHash;
        this.keyPrefix = keyPrefix;
        this.name = name;
    }

    public UUID getId() { return id; }
    public UUID getProjectId() { return projectId; }
    public String getKeyHash() { return keyHash; }
    public String getKeyPrefix() { return keyPrefix; }
    public @Nullable String getName() { return name; }
    public @Nullable Instant getLastUsedAt() { return lastUsedAt; }
    public Instant getCreatedAt() { return createdAt; }

    public void setName(@Nullable String name) { this.name = name; }
}
