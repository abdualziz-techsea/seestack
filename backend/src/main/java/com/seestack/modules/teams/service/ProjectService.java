package com.seestack.modules.teams.service;

import com.seestack.modules.teams.entity.ProjectEntity;
import com.seestack.modules.teams.repository.ProjectRepository;
import com.seestack.shared.exception.EntityNotFoundException;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@NullMarked
public class ProjectService {

    private final ProjectRepository repository;

    public ProjectService(ProjectRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public ProjectEntity create(UUID orgId, String name, String slug, @Nullable String platform) {
        return repository.save(new ProjectEntity(orgId, name, slug, platform));
    }

    @Transactional(readOnly = true)
    public Page<ProjectEntity> list(UUID orgId, int page, int perPage) {
        return repository.findByOrgId(orgId,
                PageRequest.of(Math.max(0, page - 1), perPage, Sort.by(Sort.Direction.DESC, "createdAt")));
    }

    @Transactional(readOnly = true)
    public ProjectEntity getById(UUID orgId, UUID projectId) {
        return repository.findByIdAndOrgId(projectId, orgId)
                .orElseThrow(() -> new EntityNotFoundException("Project", projectId));
    }

    @Transactional
    public ProjectEntity update(UUID orgId, UUID projectId, String name, String slug, @Nullable String platform) {
        ProjectEntity entity = getById(orgId, projectId);
        entity.update(name, slug, platform);
        return repository.save(entity);
    }

    @Transactional
    public void delete(UUID orgId, UUID projectId) {
        ProjectEntity entity = getById(orgId, projectId);
        repository.delete(entity);
    }
}
