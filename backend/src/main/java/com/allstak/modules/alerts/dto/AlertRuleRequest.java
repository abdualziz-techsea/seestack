package com.allstak.modules.alerts.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;

import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@NullMarked
public record AlertRuleRequest(
        @NotNull UUID projectId,
        @NotBlank String name,
        @NotBlank String triggerType,
        @Nullable Map<String, Object> triggerConfig,
        @Nullable String severityFilter,
        @Nullable Boolean quietHoursEnabled,
        @Nullable LocalTime quietStart,
        @Nullable LocalTime quietEnd,
        @NotNull List<Map<String, Object>> channels
) {
    public AlertRuleRequest {
        if (triggerConfig == null) triggerConfig = Map.of();
        if (severityFilter == null) severityFilter = "all";
        if (quietHoursEnabled == null) quietHoursEnabled = false;
        if (quietStart == null) quietStart = LocalTime.of(23, 0);
        if (quietEnd == null) quietEnd = LocalTime.of(8, 0);
    }
}
