package com.seestack.modules.flags.repository;

import jakarta.persistence.*;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@NullMarked
public interface FeatureFlagRepository extends JpaRepository<com.seestack.modules.flags.repository.FeatureFlagEntity, UUID> {
    List<FeatureFlagEntity> findByProjectIdOrderByCreatedAtDesc(UUID projectId);
    Optional<FeatureFlagEntity> findByProjectIdAndKey(UUID projectId, String key);
    boolean existsByProjectIdAndKey(UUID projectId, String key);
    List<FeatureFlagEntity> findByProjectIdAndActiveTrue(UUID projectId);
}
