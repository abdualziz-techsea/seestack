package com.allstak.modules.flags.repository;

import jakarta.persistence.*;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.UUID;

@NullMarked
public interface FlagAuditLogRepository extends JpaRepository<FlagAuditLogEntity, UUID> {
    Page<FlagAuditLogEntity> findByFlagIdAndProjectIdOrderByCreatedAtDesc(UUID flagId, UUID projectId, Pageable pageable);
}
