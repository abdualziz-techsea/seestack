package com.allstak.modules.alerts.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.jspecify.annotations.NullMarked;

import java.time.Instant;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "alert_rules")
@NullMarked
public class AlertRuleEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(nullable = false)
    private String name;

    @Column(name = "trigger_type", nullable = false, length = 50)
    private String triggerType;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "trigger_config", nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> triggerConfig;

    @Column(name = "severity_filter", nullable = false, length = 20)
    private String severityFilter = "all";

    @Column(name = "quiet_hours_enabled", nullable = false)
    private boolean quietHoursEnabled;

    @Column(name = "quiet_start", nullable = false)
    private LocalTime quietStart = LocalTime.of(23, 0);

    @Column(name = "quiet_end", nullable = false)
    private LocalTime quietEnd = LocalTime.of(8, 0);

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private List<Map<String, Object>> channels;

    @Column(name = "is_enabled", nullable = false)
    private boolean enabled = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    protected AlertRuleEntity() {}

    public AlertRuleEntity(UUID projectId, String name, String triggerType,
                           Map<String, Object> triggerConfig, String severityFilter,
                           boolean quietHoursEnabled, LocalTime quietStart, LocalTime quietEnd,
                           List<Map<String, Object>> channels) {
        this.projectId = projectId;
        this.name = name;
        this.triggerType = triggerType;
        this.triggerConfig = triggerConfig;
        this.severityFilter = severityFilter;
        this.quietHoursEnabled = quietHoursEnabled;
        this.quietStart = quietStart;
        this.quietEnd = quietEnd;
        this.channels = channels;
    }

    public UUID getId() { return id; }
    public UUID getProjectId() { return projectId; }
    public String getName() { return name; }
    public String getTriggerType() { return triggerType; }
    public Map<String, Object> getTriggerConfig() { return triggerConfig; }
    public String getSeverityFilter() { return severityFilter; }
    public boolean isQuietHoursEnabled() { return quietHoursEnabled; }
    public LocalTime getQuietStart() { return quietStart; }
    public LocalTime getQuietEnd() { return quietEnd; }
    public List<Map<String, Object>> getChannels() { return channels; }
    public boolean isEnabled() { return enabled; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }

    public void setEnabled(boolean enabled) { this.enabled = enabled; this.updatedAt = Instant.now(); }

    public void update(String name, String triggerType, Map<String, Object> triggerConfig,
                       String severityFilter, boolean quietHoursEnabled,
                       LocalTime quietStart, LocalTime quietEnd,
                       List<Map<String, Object>> channels) {
        this.name = name;
        this.triggerType = triggerType;
        this.triggerConfig = triggerConfig;
        this.severityFilter = severityFilter;
        this.quietHoursEnabled = quietHoursEnabled;
        this.quietStart = quietStart;
        this.quietEnd = quietEnd;
        this.channels = channels;
        this.updatedAt = Instant.now();
    }
}
