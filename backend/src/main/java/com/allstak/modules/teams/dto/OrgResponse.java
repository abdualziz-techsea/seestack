package com.allstak.modules.teams.dto;

import com.allstak.modules.teams.entity.OrganizationEntity;
import org.jspecify.annotations.NullMarked;

import java.time.Instant;
import java.util.UUID;

@NullMarked
public record OrgResponse(UUID id, String name, String slug, String plan, Instant createdAt) {
    public static OrgResponse from(OrganizationEntity e) {
        return new OrgResponse(e.getId(), e.getName(), e.getSlug(), e.getPlan(), e.getCreatedAt());
    }
}
