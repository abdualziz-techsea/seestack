package com.seestack.modules.chat.repository;

import com.seestack.modules.chat.entity.ChatMessageEntity;
import org.jspecify.annotations.NullMarked;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

@NullMarked
public interface ChatMessageRepository extends JpaRepository<ChatMessageEntity, UUID> {
    Page<ChatMessageEntity> findByChannelId(UUID channelId, Pageable pageable);

    @Query("SELECT m FROM ChatMessageEntity m WHERE m.channelId = ?1 AND m.pinned = true AND m.deleted = false ORDER BY m.createdAt DESC")
    List<ChatMessageEntity> findByChannelIdAndPinnedTrueAndDeletedFalse(UUID channelId);

    @Query("SELECT m FROM ChatMessageEntity m JOIN com.seestack.modules.chat.entity.ChatChannelEntity c ON c.id = m.channelId WHERE c.orgId = ?1 AND m.deleted = false AND LOWER(m.content) LIKE LOWER(CONCAT('%', ?2, '%')) ORDER BY m.createdAt DESC")
    List<ChatMessageEntity> searchByOrgAndContent(UUID orgId, String query);
}
