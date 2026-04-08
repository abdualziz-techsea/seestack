package com.seestack.modules.chat.repository;

import com.seestack.modules.chat.entity.ChatChannelEntity;
import org.jspecify.annotations.NullMarked;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

@NullMarked
public interface ChatChannelRepository extends JpaRepository<ChatChannelEntity, UUID> {
    Page<ChatChannelEntity> findByOrgId(UUID orgId, Pageable pageable);
    Optional<ChatChannelEntity> findByIdAndOrgId(UUID id, UUID orgId);
    boolean existsByOrgIdAndName(UUID orgId, String name);
}
