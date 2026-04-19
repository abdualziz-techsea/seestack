package com.seestack.modules.teams.service;

import com.seestack.modules.teams.entity.ApiKeyEntity;
import com.seestack.modules.teams.entity.ProjectEntity;
import com.seestack.modules.teams.repository.ApiKeyManagementRepository;
import com.seestack.modules.teams.repository.ProjectRepository;
import com.seestack.shared.exception.EntityNotFoundException;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@NullMarked
public class ProjectService {

    private final ProjectRepository repository;
    private final ApiKeyManagementRepository apiKeyRepository;
    private final ApiKeyGeneratorService apiKeyGenerator;

    public ProjectService(ProjectRepository repository,
                          ApiKeyManagementRepository apiKeyRepository,
                          ApiKeyGeneratorService apiKeyGenerator) {
        this.repository = repository;
        this.apiKeyRepository = apiKeyRepository;
        this.apiKeyGenerator = apiKeyGenerator;
    }

    /** Returns the newly-created project and the one-time raw API key. */
    @Transactional
    public CreateResult create(UUID userId, String name, @Nullable String platform) {
        String slug = uniqueSlug(userId, toSlug(name));
        ProjectEntity project = repository.save(new ProjectEntity(userId, name, slug, platform));
        String rawKey = apiKeyGenerator.generateKey("production");
        String hash = apiKeyGenerator.hashKey(rawKey);
        String prefix = apiKeyGenerator.extractPrefix(rawKey);
        ApiKeyEntity key = apiKeyRepository.save(new ApiKeyEntity(project.getId(), hash, prefix, "Default"));
        return new CreateResult(project, key, rawKey);
    }

    @Transactional(readOnly = true)
    public List<ProjectEntity> listAll(UUID userId) {
        return repository.findByUserIdOrderByCreatedAtAsc(userId);
    }

    @Transactional(readOnly = true)
    public ProjectEntity getById(UUID userId, UUID projectId) {
        return repository.findByIdAndUserId(projectId, userId)
                .orElseThrow(() -> new EntityNotFoundException("Project", projectId));
    }

    @Transactional(readOnly = true)
    public @Nullable ApiKeyEntity latestKey(UUID projectId) {
        var page = apiKeyRepository.findByProjectId(projectId,
                PageRequest.of(0, 1, Sort.by(Sort.Direction.DESC, "createdAt")));
        return page.isEmpty() ? null : page.getContent().get(0);
    }

    @Transactional
    public void delete(UUID userId, UUID projectId) {
        ProjectEntity entity = getById(userId, projectId);
        repository.delete(entity);
    }

    private String toSlug(String name) {
        String base = name.trim().toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-+|-+$", "");
        return base.isBlank() ? "project" : base;
    }

    private String uniqueSlug(UUID userId, String base) {
        String candidate = base;
        int suffix = 1;
        while (repository.existsByUserIdAndSlug(userId, candidate)) {
            candidate = base + "-" + (++suffix);
        }
        return candidate;
    }

    public record CreateResult(ProjectEntity project, ApiKeyEntity key, String rawKey) {}
}
