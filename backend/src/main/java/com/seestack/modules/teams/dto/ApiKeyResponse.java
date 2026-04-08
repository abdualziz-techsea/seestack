package com.seestack.modules.teams.dto;

import com.seestack.modules.teams.entity.ApiKeyEntity;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;

import java.time.Instant;
import java.util.UUID;

@NullMarked
public record ApiKeyResponse(UUID id, UUID projectId, @Nullable String name,
                               @Nullable String key, @Nullable Instant lastUsedAt,
                               Instant createdAt) {
    public static ApiKeyResponse from(ApiKeyEntity e) {
        return new ApiKeyResponse(e.getId(), e.getProjectId(), e.getName(),
                null, e.getLastUsedAt(), e.getCreatedAt());
    }

    public static ApiKeyResponse withKey(ApiKeyEntity e, String rawKey) {
        return new ApiKeyResponse(e.getId(), e.getProjectId(), e.getName(),
                rawKey, e.getLastUsedAt(), e.getCreatedAt());
    }
}
