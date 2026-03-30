package com.allstak.modules.monitors.entity;

import jakarta.persistence.*;
import org.jspecify.annotations.NullMarked;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "monitor_configs")
@NullMarked
public class MonitorConfigEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String url;

    @Column(name = "interval_minutes", nullable = false)
    private int intervalMinutes = 5;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected MonitorConfigEntity() {}

    public MonitorConfigEntity(UUID projectId, String name, String url, int intervalMinutes) {
        this.projectId = projectId;
        this.name = name;
        this.url = url;
        this.intervalMinutes = intervalMinutes;
    }

    public UUID getId() { return id; }
    public UUID getProjectId() { return projectId; }
    public String getName() { return name; }
    public String getUrl() { return url; }
    public int getIntervalMinutes() { return intervalMinutes; }
    public boolean isActive() { return active; }
    public Instant getCreatedAt() { return createdAt; }

    public void update(String name, String url, int intervalMinutes, boolean active) {
        this.name = name;
        this.url = url;
        this.intervalMinutes = intervalMinutes;
        this.active = active;
    }
}
