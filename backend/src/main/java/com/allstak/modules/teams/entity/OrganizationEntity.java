package com.allstak.modules.teams.entity;

import jakarta.persistence.*;
import org.jspecify.annotations.NullMarked;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "organizations")
@NullMarked
public class OrganizationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true, length = 100)
    private String slug;

    @Column(nullable = false, length = 50)
    private String plan = "free";

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected OrganizationEntity() {}

    public OrganizationEntity(String name, String slug) {
        this.name = name;
        this.slug = slug;
    }

    public UUID getId() { return id; }
    public String getName() { return name; }
    public String getSlug() { return slug; }
    public String getPlan() { return plan; }
    public Instant getCreatedAt() { return createdAt; }

    public void update(String name, String slug) {
        this.name = name;
        this.slug = slug;
    }
}
