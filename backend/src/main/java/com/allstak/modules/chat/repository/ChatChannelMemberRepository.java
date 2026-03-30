package com.allstak.modules.chat.repository;

import com.allstak.modules.chat.entity.ChatChannelMemberEntity;
import org.jspecify.annotations.NullMarked;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

@NullMarked
public interface ChatChannelMemberRepository extends JpaRepository<ChatChannelMemberEntity, UUID> {
    List<ChatChannelMemberEntity> findByChannelId(UUID channelId);
    boolean existsByChannelIdAndUserId(UUID channelId, UUID userId);
    void deleteByChannelIdAndUserId(UUID channelId, UUID userId);
}
