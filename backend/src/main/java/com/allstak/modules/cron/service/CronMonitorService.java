package com.allstak.modules.cron.service;

import com.allstak.modules.cron.dto.CronMonitorResponse;
import com.allstak.modules.cron.dto.CronPingResponse;
import com.allstak.modules.cron.entity.CronMonitorEntity;
import com.allstak.modules.cron.repository.CronMonitorRepository;
import com.allstak.shared.exception.EntityNotFoundException;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@NullMarked
public class CronMonitorService {

    private final CronMonitorRepository repository;
    private final CronPingQueryService pingQueryService;
    private final CronScheduleParser scheduleParser;

    public CronMonitorService(CronMonitorRepository repository,
                               CronPingQueryService pingQueryService,
                               CronScheduleParser scheduleParser) {
        this.repository = repository;
        this.pingQueryService = pingQueryService;
        this.scheduleParser = scheduleParser;
    }

    @Transactional
    public CronMonitorEntity create(UUID projectId, String name, String slug, String schedule, int gracePeriodMin) {
        if (repository.existsByProjectIdAndSlug(projectId, slug)) {
            throw new IllegalStateException("A cron monitor with slug '" + slug + "' already exists in this project");
        }
        return repository.save(new CronMonitorEntity(projectId, name, slug, schedule, gracePeriodMin));
    }

    @Transactional(readOnly = true)
    public List<CronMonitorEntity> list(UUID projectId) {
        return repository.findByProjectId(projectId);
    }

    @Transactional(readOnly = true)
    public CronMonitorEntity getById(UUID projectId, UUID id) {
        return repository.findByIdAndProjectId(id, projectId)
                .orElseThrow(() -> new EntityNotFoundException("CronMonitor", id));
    }

    @Transactional(readOnly = true)
    public CronMonitorEntity getBySlug(UUID projectId, String slug) {
        return repository.findByProjectIdAndSlug(projectId, slug)
                .orElse(null);
    }

    @Transactional
    public CronMonitorEntity update(UUID projectId, UUID id, String name, String schedule, int gracePeriodMin) {
        CronMonitorEntity entity = getById(projectId, id);
        entity.update(name, schedule, gracePeriodMin);
        return repository.save(entity);
    }

    @Transactional
    public void delete(UUID projectId, UUID id) {
        CronMonitorEntity entity = getById(projectId, id);
        repository.delete(entity);
    }

    @Transactional(readOnly = true)
    public List<CronMonitorEntity> findAllActive() {
        return repository.findAllActive();
    }

    public CronMonitorResponse toResponse(CronMonitorEntity monitor) {
        CronPingResponse lastPing = pingQueryService.findLastPing(monitor.getId());
        String status = resolveStatus(monitor, lastPing);

        Instant lastPingAt = lastPing != null ? lastPing.timestamp() : null;
        Instant nextExpectedAt = null;
        if (lastPingAt != null || monitor.getCreatedAt() != null) {
            nextExpectedAt = scheduleParser.computeNextExpectedAt(lastPingAt, monitor.getCreatedAt(), monitor.getSchedule());
        }

        return new CronMonitorResponse(
                monitor.getId(),
                monitor.getName(),
                monitor.getSlug(),
                monitor.getSchedule(),
                monitor.getGracePeriodMin(),
                monitor.isActive(),
                status,
                lastPingAt,
                nextExpectedAt,
                lastPing != null ? lastPing.durationMs() : 0,
                lastPing != null ? lastPing.message() : null,
                monitor.getCreatedAt()
        );
    }

    public String resolveStatus(CronMonitorEntity monitor, @Nullable CronPingResponse lastPing) {
        if (lastPing == null) return "pending";
        if ("failed".equals(lastPing.status())) return "failed";

        Instant nextExpectedAt = scheduleParser.computeNextExpectedAt(
                lastPing.timestamp(), monitor.getCreatedAt(), monitor.getSchedule());
        Instant graceDeadline = nextExpectedAt.plus(Duration.ofMinutes(monitor.getGracePeriodMin()));
        Instant now = Instant.now();

        if (now.isBefore(nextExpectedAt) || now.equals(nextExpectedAt)) return "healthy";
        if (now.isBefore(graceDeadline)) return "late";
        return "missed";
    }
}
