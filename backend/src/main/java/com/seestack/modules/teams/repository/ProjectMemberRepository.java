package com.seestack.modules.teams.repository;

import com.seestack.modules.teams.entity.ProjectMemberEntity;
import org.jspecify.annotations.NullMarked;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

@NullMarked
public interface ProjectMemberRepository extends JpaRepository<ProjectMemberEntity, UUID> {
    Page<ProjectMemberEntity> findByProjectId(UUID projectId, Pageable pageable);
    Optional<ProjectMemberEntity> findByProjectIdAndUserId(UUID projectId, UUID userId);
    Optional<ProjectMemberEntity> findByIdAndProjectId(UUID id, UUID projectId);
}
