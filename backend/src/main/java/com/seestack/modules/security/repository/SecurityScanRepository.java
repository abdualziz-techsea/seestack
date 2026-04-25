package com.seestack.modules.security.repository;

import com.seestack.modules.security.entity.SecurityScanEntity;
import org.jspecify.annotations.NullMarked;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

@NullMarked
public interface SecurityScanRepository extends JpaRepository<SecurityScanEntity, UUID> {
    Page<SecurityScanEntity> findAllByOrderByCreatedAtDesc(Pageable pageable);
    Optional<SecurityScanEntity> findTopByOrderByCreatedAtDesc();
}
