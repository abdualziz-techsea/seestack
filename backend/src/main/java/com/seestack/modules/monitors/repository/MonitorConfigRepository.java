package com.seestack.modules.monitors.repository;

import com.seestack.modules.monitors.entity.MonitorConfigEntity;
import org.jspecify.annotations.NullMarked;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@NullMarked
public interface MonitorConfigRepository extends JpaRepository<MonitorConfigEntity, UUID> {

    Page<MonitorConfigEntity> findByProjectId(UUID projectId, Pageable pageable);

    Optional<MonitorConfigEntity> findByIdAndProjectId(UUID id, UUID projectId);

    List<MonitorConfigEntity> findByActiveTrue();
}
