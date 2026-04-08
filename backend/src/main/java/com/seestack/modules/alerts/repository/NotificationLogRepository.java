package com.seestack.modules.alerts.repository;

import com.seestack.modules.alerts.entity.NotificationLogEntity;
import org.jspecify.annotations.NullMarked;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

@NullMarked
public interface NotificationLogRepository extends JpaRepository<NotificationLogEntity, UUID> {

    Page<NotificationLogEntity> findByProjectId(UUID projectId, Pageable pageable);

    long countByProjectIdAndIsReadFalse(UUID projectId);

    @Modifying
    @Query("UPDATE NotificationLogEntity n SET n.isRead = true WHERE n.projectId = :projectId AND n.isRead = false")
    void markAllReadByProjectId(@Param("projectId") UUID projectId);
}
