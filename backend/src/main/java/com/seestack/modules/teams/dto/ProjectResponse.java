package com.seestack.modules.teams.dto;

import com.seestack.modules.teams.entity.ApiKeyEntity;
import com.seestack.modules.teams.entity.ProjectEntity;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;

import java.time.Instant;
import java.util.UUID;

@NullMarked
public record ProjectResponse(
        UUID id,
        String name,
        String slug,
        @Nullable String platform,
        Instant createdAt,
        @Nullable String apiKey,        // raw key — only returned right after create
        @Nullable String apiKeyPrefix   // safe preview, e.g. "ask_live_"
) {
    public static ProjectResponse from(ProjectEntity e) {
        return new ProjectResponse(e.getId(), e.getName(), e.getSlug(),
                e.getPlatform(), e.getCreatedAt(), null, null);
    }

    public static ProjectResponse fromWithPrefix(ProjectEntity e, @Nullable ApiKeyEntity key) {
        return new ProjectResponse(e.getId(), e.getName(), e.getSlug(),
                e.getPlatform(), e.getCreatedAt(), null,
                key == null ? null : key.getKeyPrefix());
    }

    public static ProjectResponse afterCreate(ProjectEntity e, ApiKeyEntity key, String rawKey) {
        return new ProjectResponse(e.getId(), e.getName(), e.getSlug(),
                e.getPlatform(), e.getCreatedAt(), rawKey, key.getKeyPrefix());
    }
}
