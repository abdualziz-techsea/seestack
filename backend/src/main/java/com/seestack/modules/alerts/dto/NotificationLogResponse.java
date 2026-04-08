package com.seestack.modules.alerts.dto;

import com.seestack.modules.alerts.entity.NotificationLogEntity;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;

import java.time.Instant;
import java.util.UUID;

@NullMarked
public record NotificationLogResponse(
        UUID id, UUID alertRuleId, UUID projectId, String triggerType,
        String channelType, String status, @Nullable String errorMessage, Instant sentAt,
        boolean isRead
) {
    public static NotificationLogResponse from(NotificationLogEntity e) {
        return new NotificationLogResponse(
                e.getId(), e.getAlertRuleId(), e.getProjectId(), e.getTriggerType(),
                e.getChannelType(), e.getStatus(), e.getErrorMessage(), e.getSentAt(),
                e.isRead());
    }
}
