package com.seestack.modules.teams.service;

import com.seestack.modules.teams.entity.OrganizationEntity;
import com.seestack.modules.teams.repository.OrganizationRepository;
import com.seestack.shared.exception.EntityNotFoundException;
import org.jspecify.annotations.NullMarked;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@NullMarked
public class OrganizationService {

    private final OrganizationRepository repository;

    public OrganizationService(OrganizationRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public OrganizationEntity create(String name, String slug) {
        return repository.save(new OrganizationEntity(name, slug));
    }

    @Transactional(readOnly = true)
    public Page<OrganizationEntity> list(int page, int perPage) {
        return repository.findAll(
                PageRequest.of(Math.max(0, page - 1), perPage, Sort.by(Sort.Direction.DESC, "createdAt")));
    }

    @Transactional(readOnly = true)
    public OrganizationEntity getById(UUID orgId) {
        return repository.findById(orgId)
                .orElseThrow(() -> new EntityNotFoundException("Organization", orgId));
    }

    @Transactional
    public OrganizationEntity update(UUID orgId, String name, String slug) {
        OrganizationEntity entity = getById(orgId);
        entity.update(name, slug);
        return repository.save(entity);
    }

    @Transactional
    public void delete(UUID orgId) {
        OrganizationEntity entity = getById(orgId);
        repository.delete(entity);
    }
}
