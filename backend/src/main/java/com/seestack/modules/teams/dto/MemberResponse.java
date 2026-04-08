package com.seestack.modules.teams.dto;

import com.seestack.modules.teams.entity.ProjectMemberEntity;
import org.jspecify.annotations.NullMarked;

import java.time.Instant;
import java.util.UUID;

@NullMarked
public record MemberResponse(UUID id, UUID projectId, UUID userId,
                               boolean canErrors, boolean canLogs,
                               boolean canMonitors, boolean canSsh,
                               Instant createdAt) {
    public static MemberResponse from(ProjectMemberEntity e) {
        return new MemberResponse(e.getId(), e.getProjectId(), e.getUserId(),
                e.isCanErrors(), e.isCanLogs(), e.isCanMonitors(), e.isCanSsh(),
                e.getCreatedAt());
    }
}
