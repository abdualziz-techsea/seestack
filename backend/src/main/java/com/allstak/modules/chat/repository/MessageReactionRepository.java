package com.allstak.modules.chat.repository;

import com.allstak.modules.chat.entity.MessageReactionEntity;
import org.jspecify.annotations.NullMarked;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@NullMarked
public interface MessageReactionRepository extends JpaRepository<MessageReactionEntity, UUID> {
    List<MessageReactionEntity> findByMessageId(UUID messageId);
    List<MessageReactionEntity> findByMessageIdIn(List<UUID> messageIds);
    Optional<MessageReactionEntity> findByMessageIdAndUserIdAndEmoji(UUID messageId, UUID userId, String emoji);
    void deleteByMessageIdAndUserIdAndEmoji(UUID messageId, UUID userId, String emoji);
    boolean existsByMessageIdAndUserIdAndEmoji(UUID messageId, UUID userId, String emoji);
}
