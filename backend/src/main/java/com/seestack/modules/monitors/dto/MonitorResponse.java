package com.seestack.modules.monitors.dto;

import com.seestack.modules.monitors.entity.MonitorConfigEntity;
import org.jspecify.annotations.NullMarked;

import java.time.Instant;
import java.util.UUID;

@NullMarked
public record MonitorResponse(
        UUID id,
        UUID projectId,
        String name,
        String url,
        int intervalMinutes,
        boolean isActive,
        Instant createdAt
) {
    public static MonitorResponse from(MonitorConfigEntity e) {
        return new MonitorResponse(
                e.getId(), e.getProjectId(), e.getName(), e.getUrl(),
                e.getIntervalMinutes(), e.isActive(), e.getCreatedAt()
        );
    }
}
