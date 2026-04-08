package com.seestack.modules.teams.repository;

import com.seestack.modules.teams.entity.ProjectEntity;
import org.jspecify.annotations.NullMarked;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

@NullMarked
public interface ProjectRepository extends JpaRepository<ProjectEntity, UUID> {
    Page<ProjectEntity> findByOrgId(UUID orgId, Pageable pageable);
    Optional<ProjectEntity> findByIdAndOrgId(UUID id, UUID orgId);
    boolean existsByOrgIdAndSlug(UUID orgId, String slug);
}
