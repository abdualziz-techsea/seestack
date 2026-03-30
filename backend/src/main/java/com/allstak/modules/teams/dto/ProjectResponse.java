package com.allstak.modules.teams.dto;

import com.allstak.modules.teams.entity.ProjectEntity;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;

import java.time.Instant;
import java.util.UUID;

@NullMarked
public record ProjectResponse(UUID id, UUID orgId, String name, String slug,
                                @Nullable String platform, Instant createdAt) {
    public static ProjectResponse from(ProjectEntity e) {
        return new ProjectResponse(e.getId(), e.getOrgId(), e.getName(), e.getSlug(),
                e.getPlatform(), e.getCreatedAt());
    }
}
