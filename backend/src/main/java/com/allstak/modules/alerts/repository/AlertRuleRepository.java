package com.allstak.modules.alerts.repository;

import com.allstak.modules.alerts.entity.AlertRuleEntity;
import org.jspecify.annotations.NullMarked;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@NullMarked
public interface AlertRuleRepository extends JpaRepository<AlertRuleEntity, UUID> {
    Page<AlertRuleEntity> findByProjectId(UUID projectId, Pageable pageable);
    Optional<AlertRuleEntity> findByIdAndProjectId(UUID id, UUID projectId);
    List<AlertRuleEntity> findByProjectIdAndTriggerTypeAndEnabledTrue(UUID projectId, String triggerType);
}
