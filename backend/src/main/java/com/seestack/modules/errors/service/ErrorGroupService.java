package com.seestack.modules.errors.service;

import com.seestack.modules.errors.entity.ErrorGroupEntity;
import com.seestack.modules.errors.repository.ErrorGroupRepository;
import com.seestack.shared.exception.EntityNotFoundException;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@NullMarked
public class ErrorGroupService {

    private final ErrorGroupRepository repository;

    public ErrorGroupService(ErrorGroupRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public void upsert(UUID projectId, String fingerprint, String exceptionClass,
                       String title, @Nullable String level, @Nullable String environment,
                       Instant timestamp) {
        int updated = repository.incrementOccurrence(projectId, fingerprint, timestamp);
        if (updated == 0) {
            ErrorGroupEntity group = new ErrorGroupEntity(
                    projectId, fingerprint, exceptionClass, title, level, environment, timestamp);
            repository.save(group);
        }
    }

    @Transactional(readOnly = true)
    public Page<ErrorGroupEntity> list(UUID projectId, @Nullable String status,
                                       @Nullable String level, @Nullable String environment,
                                       int page, int perPage) {
        PageRequest pageable = PageRequest.of(Math.max(0, page - 1), perPage, Sort.by(Sort.Direction.DESC, "lastSeen"));
        return repository.search(projectId, status, level, environment, pageable);
    }

    @Transactional(readOnly = true)
    public ErrorGroupEntity getByFingerprint(UUID projectId, String fingerprint) {
        return repository.findByProjectIdAndFingerprint(projectId, fingerprint)
                .orElseThrow(() -> new EntityNotFoundException("ErrorGroup", fingerprint));
    }

    @Transactional
    public ErrorGroupEntity updateStatus(UUID projectId, String fingerprint, String status) {
        ErrorGroupEntity group = getByFingerprint(projectId, fingerprint);
        group.updateStatus(status);
        return repository.save(group);
    }
}
