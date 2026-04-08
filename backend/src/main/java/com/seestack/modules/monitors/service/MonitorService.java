package com.seestack.modules.monitors.service;

import com.seestack.modules.monitors.entity.MonitorConfigEntity;
import com.seestack.modules.monitors.repository.MonitorConfigRepository;
import com.seestack.shared.exception.EntityNotFoundException;
import org.jspecify.annotations.NullMarked;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@NullMarked
public class MonitorService {

    private final MonitorConfigRepository repository;

    public MonitorService(MonitorConfigRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public MonitorConfigEntity create(UUID projectId, String name, String url, int intervalMinutes) {
        var entity = new MonitorConfigEntity(projectId, name, url, intervalMinutes);
        return repository.save(entity);
    }

    @Transactional(readOnly = true)
    public Page<MonitorConfigEntity> list(UUID projectId, int page, int perPage) {
        PageRequest pageable = PageRequest.of(Math.max(0, page - 1), perPage,
                Sort.by(Sort.Direction.DESC, "createdAt"));
        return repository.findByProjectId(projectId, pageable);
    }

    @Transactional(readOnly = true)
    public MonitorConfigEntity getById(UUID projectId, UUID monitorId) {
        return repository.findByIdAndProjectId(monitorId, projectId)
                .orElseThrow(() -> new EntityNotFoundException("Monitor", monitorId));
    }

    @Transactional
    public MonitorConfigEntity update(UUID projectId, UUID monitorId,
                                       String name, String url, int intervalMinutes, boolean active) {
        MonitorConfigEntity entity = getById(projectId, monitorId);
        entity.update(name, url, intervalMinutes, active);
        return repository.save(entity);
    }

    @Transactional
    public void delete(UUID projectId, UUID monitorId) {
        MonitorConfigEntity entity = getById(projectId, monitorId);
        repository.delete(entity);
    }

    @Transactional(readOnly = true)
    public List<MonitorConfigEntity> findActiveMonitors() {
        return repository.findByActiveTrue();
    }
}
