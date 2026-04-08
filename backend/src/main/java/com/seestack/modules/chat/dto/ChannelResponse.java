package com.seestack.modules.chat.dto;

import com.seestack.modules.chat.entity.ChatChannelEntity;
import org.jspecify.annotations.NullMarked;

import java.time.Instant;
import java.util.UUID;

@NullMarked
public record ChannelResponse(UUID id, UUID orgId, String name, boolean isDefault, Instant createdAt) {
    public static ChannelResponse from(ChatChannelEntity e) {
        return new ChannelResponse(e.getId(), e.getOrgId(), e.getName(), e.isDefault(), e.getCreatedAt());
    }
}
