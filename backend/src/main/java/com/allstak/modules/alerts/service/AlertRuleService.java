package com.allstak.modules.alerts.service;

import com.allstak.modules.alerts.entity.AlertRuleEntity;
import com.allstak.modules.alerts.repository.AlertRuleRepository;
import com.allstak.shared.exception.EntityNotFoundException;
import org.jspecify.annotations.NullMarked;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@NullMarked
public class AlertRuleService {

    private final AlertRuleRepository repository;

    public AlertRuleService(AlertRuleRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public AlertRuleEntity create(UUID projectId, String name, String triggerType,
                                   Map<String, Object> triggerConfig, String severityFilter,
                                   boolean quietHoursEnabled, LocalTime quietStart, LocalTime quietEnd,
                                   List<Map<String, Object>> channels) {
        return repository.save(new AlertRuleEntity(projectId, name, triggerType, triggerConfig,
                severityFilter, quietHoursEnabled, quietStart, quietEnd, channels));
    }

    @Transactional(readOnly = true)
    public Page<AlertRuleEntity> list(UUID projectId, int page, int perPage) {
        return repository.findByProjectId(projectId,
                PageRequest.of(Math.max(0, page - 1), perPage, Sort.by(Sort.Direction.DESC, "createdAt")));
    }

    @Transactional(readOnly = true)
    public AlertRuleEntity getById(UUID ruleId) {
        return repository.findById(ruleId)
                .orElseThrow(() -> new EntityNotFoundException("AlertRule", ruleId));
    }

    @Transactional
    public AlertRuleEntity update(UUID ruleId, String name, String triggerType,
                                   Map<String, Object> triggerConfig, String severityFilter,
                                   boolean quietHoursEnabled, LocalTime quietStart, LocalTime quietEnd,
                                   List<Map<String, Object>> channels) {
        AlertRuleEntity entity = getById(ruleId);
        entity.update(name, triggerType, triggerConfig, severityFilter,
                quietHoursEnabled, quietStart, quietEnd, channels);
        return repository.save(entity);
    }

    @Transactional
    public void delete(UUID ruleId) {
        AlertRuleEntity entity = getById(ruleId);
        repository.delete(entity);
    }

    @Transactional
    public AlertRuleEntity toggle(UUID ruleId) {
        AlertRuleEntity entity = getById(ruleId);
        entity.setEnabled(!entity.isEnabled());
        return repository.save(entity);
    }

    @Transactional(readOnly = true)
    public List<AlertRuleEntity> findEnabledRules(UUID projectId, String triggerType) {
        return repository.findByProjectIdAndTriggerTypeAndEnabledTrue(projectId, triggerType);
    }
}
