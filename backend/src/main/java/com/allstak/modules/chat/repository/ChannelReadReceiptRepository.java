package com.allstak.modules.chat.repository;

import com.allstak.modules.chat.entity.ChannelReadReceiptEntity;
import org.jspecify.annotations.NullMarked;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

@NullMarked
public interface ChannelReadReceiptRepository extends JpaRepository<ChannelReadReceiptEntity, UUID> {
    Optional<ChannelReadReceiptEntity> findByChannelIdAndUserId(UUID channelId, UUID userId);
}
