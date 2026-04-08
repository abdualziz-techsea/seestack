package com.seestack.modules.flags.service;

import com.seestack.modules.flags.dto.*;
import com.seestack.modules.flags.repository.*;
import com.seestack.shared.exception.EntityNotFoundException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.*;

@Service
@NullMarked
public class FeatureFlagService {

    private final FeatureFlagRepository flagRepository;
    private final FlagAuditLogRepository auditRepository;
    private final FlagEvaluationService evaluationService;
    private final ObjectMapper objectMapper;
    private final StringRedisTemplate redisTemplate;

    public FeatureFlagService(FeatureFlagRepository flagRepository,
                               FlagAuditLogRepository auditRepository,
                               FlagEvaluationService evaluationService,
                               ObjectMapper objectMapper,
                               StringRedisTemplate redisTemplate) {
        this.flagRepository = flagRepository;
        this.auditRepository = auditRepository;
        this.evaluationService = evaluationService;
        this.objectMapper = objectMapper;
        this.redisTemplate = redisTemplate;
    }

    @Transactional
    public FeatureFlagEntity create(CreateFlagRequest request) {
        if (flagRepository.existsByProjectIdAndKey(request.projectId(), request.key())) {
            throw new IllegalStateException("A flag with key '" + request.key() + "' already exists in this project");
        }

        String rulesJson = serializeRules(request.rules());
        var entity = new FeatureFlagEntity(
                request.projectId(), request.key(), request.name(),
                request.description(), request.type(), request.defaultValue(),
                request.rolloutPercent(), rulesJson);
        entity = flagRepository.save(entity);

        writeAudit(entity.getId(), entity.getProjectId(), null, "created", null, toJson(entity));
        invalidateCache(entity.getProjectId());
        return entity;
    }

    @Transactional(readOnly = true)
    public List<FeatureFlagEntity> list(UUID projectId) {
        return flagRepository.findByProjectIdOrderByCreatedAtDesc(projectId);
    }

    @Transactional(readOnly = true)
    public FeatureFlagEntity getByKey(UUID projectId, String key) {
        return flagRepository.findByProjectIdAndKey(projectId, key)
                .orElseThrow(() -> new EntityNotFoundException("FeatureFlag", key));
    }

    @Transactional
    public FeatureFlagEntity update(UUID projectId, String key, UpdateFlagRequest request) {
        var entity = getByKey(projectId, key);
        String oldJson = toJson(entity);

        String rulesJson = serializeRules(request.rules());
        entity.update(request.name(), request.description(), request.type(),
                request.defaultValue(), request.rolloutPercent(), rulesJson);
        entity = flagRepository.save(entity);

        writeAudit(entity.getId(), projectId, null, "updated", oldJson, toJson(entity));
        invalidateCache(projectId);
        return entity;
    }

    @Transactional
    public void delete(UUID projectId, String key) {
        var entity = getByKey(projectId, key);
        writeAudit(entity.getId(), projectId, null, "deleted", toJson(entity), null);
        flagRepository.delete(entity);
        invalidateCache(projectId);
    }

    @Transactional
    public FeatureFlagEntity toggle(UUID projectId, String key) {
        var entity = getByKey(projectId, key);
        entity.toggleActive();
        entity = flagRepository.save(entity);

        String action = entity.isActive() ? "enabled" : "disabled";
        writeAudit(entity.getId(), projectId, null, action, null, toJson(entity));
        invalidateCache(projectId);
        return entity;
    }

    @Transactional(readOnly = true)
    public Page<FlagAuditLogEntity> getAuditLog(UUID flagId, UUID projectId, int page, int perPage) {
        return auditRepository.findByFlagIdAndProjectIdOrderByCreatedAtDesc(
                flagId, projectId, PageRequest.of(Math.max(0, page - 1), perPage));
    }

    public Map<String, FlagEvaluationResult> evaluateAll(UUID projectId, @Nullable String userId,
                                                          Map<String, Object> attributes) {
        List<FeatureFlagEntity> flags = flagRepository.findByProjectIdOrderByCreatedAtDesc(projectId);
        Map<String, FlagEvaluationResult> results = new LinkedHashMap<>();
        for (FeatureFlagEntity flag : flags) {
            results.put(flag.getKey(), evaluationService.evaluate(flag, userId, attributes));
        }
        return results;
    }

    public FlagEvaluationResult evaluateSingle(UUID projectId, String key,
                                                @Nullable String userId, Map<String, Object> attributes) {
        var flag = getByKey(projectId, key);
        return evaluationService.evaluate(flag, userId, attributes);
    }

    public FlagResponse toResponse(FeatureFlagEntity entity) {
        List<TargetingRuleDto> rules;
        try {
            rules = objectMapper.readValue(entity.getRules(), objectMapper.getTypeFactory()
                    .constructCollectionType(List.class, TargetingRuleDto.class));
        } catch (Exception e) {
            rules = List.of();
        }
        return new FlagResponse(
                entity.getId(), entity.getKey(), entity.getName(), entity.getDescription(),
                entity.getType(), entity.getDefaultValue(), entity.getRolloutPercent(),
                rules, entity.isActive(), entity.getCreatedAt(), entity.getUpdatedAt());
    }

    private void writeAudit(UUID flagId, UUID projectId, @Nullable UUID userId,
                             String action, @Nullable String oldValue, @Nullable String newValue) {
        auditRepository.save(new FlagAuditLogEntity(flagId, projectId, userId, action, oldValue, newValue));
    }

    private void invalidateCache(UUID projectId) {
        try {
            redisTemplate.delete("flags:" + projectId);
        } catch (Exception e) {
            // Redis unavailable — cache will expire naturally
        }
    }

    private String serializeRules(@Nullable List<TargetingRuleDto> rules) {
        if (rules == null || rules.isEmpty()) return "[]";
        try {
            return objectMapper.writeValueAsString(rules);
        } catch (Exception e) {
            return "[]";
        }
    }

    private @Nullable String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return null;
        }
    }
}
