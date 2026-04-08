package com.seestack.modules.cron.repository;

import com.seestack.modules.cron.entity.CronMonitorEntity;
import org.jspecify.annotations.NullMarked;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@NullMarked
public interface CronMonitorRepository extends JpaRepository<CronMonitorEntity, UUID> {
    List<CronMonitorEntity> findByProjectId(UUID projectId);
    Optional<CronMonitorEntity> findByProjectIdAndSlug(UUID projectId, String slug);
    Optional<CronMonitorEntity> findByIdAndProjectId(UUID id, UUID projectId);
    boolean existsByProjectIdAndSlug(UUID projectId, String slug);

    @Query("SELECT m FROM CronMonitorEntity m WHERE m.active = true")
    List<CronMonitorEntity> findAllActive();
}
