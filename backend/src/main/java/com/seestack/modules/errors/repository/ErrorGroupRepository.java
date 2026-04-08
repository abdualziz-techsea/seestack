package com.seestack.modules.errors.repository;

import com.seestack.modules.errors.entity.ErrorGroupEntity;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@NullMarked
public interface ErrorGroupRepository extends JpaRepository<ErrorGroupEntity, UUID> {

    Optional<ErrorGroupEntity> findByProjectIdAndFingerprint(UUID projectId, String fingerprint);

    @Modifying
    @Query("""
        UPDATE ErrorGroupEntity e
        SET e.occurrences = e.occurrences + 1,
            e.lastSeen = :timestamp
        WHERE e.projectId = :projectId AND e.fingerprint = :fingerprint
        """)
    int incrementOccurrence(@Param("projectId") UUID projectId,
                            @Param("fingerprint") String fingerprint,
                            @Param("timestamp") Instant timestamp);

    @Query("""
        SELECT e FROM ErrorGroupEntity e
        WHERE e.projectId = :projectId
          AND (:status IS NULL OR e.status = :status)
          AND (:level IS NULL OR e.level = :level)
          AND (:environment IS NULL OR e.environment = :environment)
        """)
    Page<ErrorGroupEntity> search(
            @Param("projectId") UUID projectId,
            @Param("status") @Nullable String status,
            @Param("level") @Nullable String level,
            @Param("environment") @Nullable String environment,
            Pageable pageable);
}
