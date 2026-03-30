package com.allstak.modules.teams.service;

import com.allstak.modules.teams.entity.ApiKeyEntity;
import com.allstak.modules.teams.repository.ApiKeyManagementRepository;
import com.allstak.shared.exception.EntityNotFoundException;
import com.allstak.shared.security.ApiKeyService;
import org.jspecify.annotations.NullMarked;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@NullMarked
public class ApiKeyManagementService {

    private static final String KEY_PREFIX = "ask_";

    private final ApiKeyManagementRepository repository;
    private final ApiKeyService apiKeyService;

    public ApiKeyManagementService(ApiKeyManagementRepository repository, ApiKeyService apiKeyService) {
        this.repository = repository;
        this.apiKeyService = apiKeyService;
    }

    /**
     * Creates a new API key. Returns the raw key (shown only once) along with the entity.
     */
    @Transactional
    public ApiKeyCreateResult create(UUID projectId, String name) {
        String rawKey = KEY_PREFIX + UUID.randomUUID().toString().replace("-", "");
        String hash = apiKeyService.hash(rawKey);
        var entity = repository.save(new ApiKeyEntity(projectId, hash, name));
        return new ApiKeyCreateResult(entity, rawKey);
    }

    @Transactional(readOnly = true)
    public Page<ApiKeyEntity> list(UUID projectId, int page, int perPage) {
        return repository.findByProjectId(projectId,
                PageRequest.of(Math.max(0, page - 1), perPage, Sort.by(Sort.Direction.DESC, "createdAt")));
    }

    @Transactional
    public ApiKeyEntity rename(UUID projectId, UUID keyId, String name) {
        ApiKeyEntity entity = repository.findByIdAndProjectId(keyId, projectId)
                .orElseThrow(() -> new EntityNotFoundException("ApiKey", keyId));
        entity.setName(name);
        return repository.save(entity);
    }

    @Transactional
    public void delete(UUID projectId, UUID keyId) {
        ApiKeyEntity entity = repository.findByIdAndProjectId(keyId, projectId)
                .orElseThrow(() -> new EntityNotFoundException("ApiKey", keyId));
        repository.delete(entity);
    }

    public record ApiKeyCreateResult(ApiKeyEntity entity, String rawKey) {}
}
