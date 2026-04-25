package com.seestack.modules.loadtest.repository;

import com.seestack.modules.loadtest.entity.LoadTestEntity;
import org.jspecify.annotations.NullMarked;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@NullMarked
public interface LoadTestRepository extends JpaRepository<LoadTestEntity, UUID> {

    Page<LoadTestEntity> findByProjectIdOrderByCreatedAtDesc(UUID projectId, Pageable pageable);

    Optional<LoadTestEntity> findByIdAndProjectId(UUID id, UUID projectId);

    Optional<LoadTestEntity> findTopByProjectIdAndTargetUrlOrderByCreatedAtDesc(UUID projectId, String targetUrl);

    Optional<LoadTestEntity> findTopByProjectIdOrderByCreatedAtDesc(UUID projectId);

    @SuppressWarnings("unused")
    Optional<LoadTestEntity> findFirstByTargetUrlAndCreatedAtAfter(String targetUrl, Instant after);
}
