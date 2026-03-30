package com.allstak.modules.teams.entity;

import jakarta.persistence.*;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "projects")
@NullMarked
public class ProjectEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "org_id", nullable = false)
    private UUID orgId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, length = 100)
    private String slug;

    @Nullable
    @Column(length = 100)
    private String platform;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected ProjectEntity() {}

    public ProjectEntity(UUID orgId, String name, String slug, @Nullable String platform) {
        this.orgId = orgId;
        this.name = name;
        this.slug = slug;
        this.platform = platform;
    }

    public UUID getId() { return id; }
    public UUID getOrgId() { return orgId; }
    public String getName() { return name; }
    public String getSlug() { return slug; }
    public @Nullable String getPlatform() { return platform; }
    public Instant getCreatedAt() { return createdAt; }

    public void update(String name, String slug, @Nullable String platform) {
        this.name = name;
        this.slug = slug;
        this.platform = platform;
    }
}
