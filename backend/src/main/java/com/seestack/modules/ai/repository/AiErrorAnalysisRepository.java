package com.seestack.modules.ai.repository;

import com.seestack.modules.ai.entity.AiErrorAnalysisEntity;
import org.jspecify.annotations.NullMarked;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

@NullMarked
public interface AiErrorAnalysisRepository extends JpaRepository<AiErrorAnalysisEntity, UUID> {
    Optional<AiErrorAnalysisEntity> findByProjectIdAndFingerprint(UUID projectId, String fingerprint);
}
