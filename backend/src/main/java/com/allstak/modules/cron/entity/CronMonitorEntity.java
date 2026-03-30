package com.allstak.modules.cron.entity;

import jakarta.persistence.*;
import org.jspecify.annotations.NullMarked;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "cron_monitors", uniqueConstraints = @UniqueConstraint(columnNames = {"project_id", "slug"}))
@NullMarked
public class CronMonitorEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String slug;

    @Column(nullable = false)
    private String schedule;

    @Column(name = "grace_period_min", nullable = false)
    private int gracePeriodMin = 5;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected CronMonitorEntity() {}

    public CronMonitorEntity(UUID projectId, String name, String slug, String schedule, int gracePeriodMin) {
        this.projectId = projectId;
        this.name = name;
        this.slug = slug;
        this.schedule = schedule;
        this.gracePeriodMin = gracePeriodMin;
    }

    public UUID getId() { return id; }
    public UUID getProjectId() { return projectId; }
    public String getName() { return name; }
    public String getSlug() { return slug; }
    public String getSchedule() { return schedule; }
    public int getGracePeriodMin() { return gracePeriodMin; }
    public boolean isActive() { return active; }
    public Instant getCreatedAt() { return createdAt; }

    public void update(String name, String schedule, int gracePeriodMin) {
        this.name = name;
        this.schedule = schedule;
        this.gracePeriodMin = gracePeriodMin;
    }
}
