package com.seestack.modules.alerts.dto;

import com.seestack.modules.alerts.entity.AlertRuleEntity;
import org.jspecify.annotations.NullMarked;

import java.time.Instant;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@NullMarked
public record AlertRuleResponse(
        UUID id, UUID projectId, String name, String triggerType,
        Map<String, Object> triggerConfig, String severityFilter,
        boolean quietHoursEnabled, LocalTime quietStart, LocalTime quietEnd,
        List<Map<String, Object>> channels, boolean isEnabled,
        Instant createdAt, Instant updatedAt
) {
    public static AlertRuleResponse from(AlertRuleEntity e) {
        return new AlertRuleResponse(
                e.getId(), e.getProjectId(), e.getName(), e.getTriggerType(),
                e.getTriggerConfig(), e.getSeverityFilter(),
                e.isQuietHoursEnabled(), e.getQuietStart(), e.getQuietEnd(),
                e.getChannels(), e.isEnabled(), e.getCreatedAt(), e.getUpdatedAt());
    }
}
