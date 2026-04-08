package com.seestack.modules.teams.repository;

import com.seestack.modules.teams.entity.ApiKeyEntity;
import org.jspecify.annotations.NullMarked;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

@NullMarked
public interface ApiKeyManagementRepository extends JpaRepository<ApiKeyEntity, UUID> {
    Page<ApiKeyEntity> findByProjectId(UUID projectId, Pageable pageable);
    Optional<ApiKeyEntity> findByIdAndProjectId(UUID id, UUID projectId);
}
