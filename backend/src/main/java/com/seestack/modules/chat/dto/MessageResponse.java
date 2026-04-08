package com.seestack.modules.chat.dto;

import com.seestack.modules.chat.entity.ChatMessageEntity;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;

import java.time.Instant;
import java.util.UUID;

@NullMarked
public record MessageResponse(UUID id, UUID channelId, UUID userId, String userName,
                                String content, @Nullable UUID linkedErrorId,
                                boolean isEdited, boolean isDeleted, boolean isPinned,
                                @Nullable Instant editedAt, Instant createdAt) {
    public static MessageResponse from(ChatMessageEntity e) {
        return new MessageResponse(e.getId(), e.getChannelId(), e.getUserId(), e.getUserName(),
                e.getContent(), e.getLinkedErrorId(),
                e.isEdited(), e.isDeleted(), e.isPinned(), e.getEditedAt(),
                e.getCreatedAt());
    }
}
