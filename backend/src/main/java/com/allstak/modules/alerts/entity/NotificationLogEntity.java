package com.allstak.modules.alerts.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "notification_log")
@NullMarked
public class NotificationLogEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "alert_rule_id", nullable = false)
    private UUID alertRuleId;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "trigger_type", nullable = false, length = 50)
    private String triggerType;

    @Column(name = "channel_type", nullable = false, length = 20)
    private String channelType;

    @Column(nullable = false, length = 20)
    private String status = "sent";

    @Nullable
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> payload;

    @Nullable
    @Column(name = "error_message")
    private String errorMessage;

    @Column(name = "sent_at", nullable = false, updatable = false)
    private Instant sentAt = Instant.now();

    @Column(name = "is_read", nullable = false)
    private boolean isRead = false;

    protected NotificationLogEntity() {}

    public NotificationLogEntity(UUID alertRuleId, UUID projectId, String triggerType,
                                  String channelType, String status,
                                  @Nullable Map<String, Object> payload,
                                  @Nullable String errorMessage) {
        this.alertRuleId = alertRuleId;
        this.projectId = projectId;
        this.triggerType = triggerType;
        this.channelType = channelType;
        this.status = status;
        this.payload = payload;
        this.errorMessage = errorMessage;
    }

    public UUID getId() { return id; }
    public UUID getAlertRuleId() { return alertRuleId; }
    public UUID getProjectId() { return projectId; }
    public String getTriggerType() { return triggerType; }
    public String getChannelType() { return channelType; }
    public String getStatus() { return status; }
    public @Nullable Map<String, Object> getPayload() { return payload; }
    public @Nullable String getErrorMessage() { return errorMessage; }
    public Instant getSentAt() { return sentAt; }
    public boolean isRead() { return isRead; }
    public void setRead(boolean read) { this.isRead = read; }
}
