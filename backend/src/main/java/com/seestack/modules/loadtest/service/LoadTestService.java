package com.seestack.modules.loadtest.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.seestack.modules.loadtest.entity.LoadTestEntity;
import com.seestack.modules.loadtest.repository.LoadTestRepository;
import com.seestack.modules.monitors.entity.MonitorConfigEntity;
import com.seestack.modules.monitors.service.MonitorService;
import com.seestack.shared.exception.EntityNotFoundException;
import org.jspecify.annotations.NullMarked;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Service
@NullMarked
public class LoadTestService {

    public static final int COOLDOWN_SECONDS = 60;

    private final LoadTestRepository repository;
    private final MonitorService monitorService;
    private final LoadTestRunner runner;
    private final ObjectMapper objectMapper;

    public LoadTestService(LoadTestRepository repository,
                           MonitorService monitorService,
                           LoadTestRunner runner,
                           ObjectMapper objectMapper) {
        this.repository = repository;
        this.monitorService = monitorService;
        this.runner = runner;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public LoadTestEntity createAndRun(UUID projectId, UUID monitorId, int requests, int concurrency) {
        // Resolve and authorize the target via the monitor
        MonitorConfigEntity monitor = monitorService.getById(projectId, monitorId);
        String targetUrl = monitor.getUrl();

        // Cooldown enforcement (60s per target/project pair)
        var prior = repository.findTopByProjectIdAndTargetUrlOrderByCreatedAtDesc(projectId, targetUrl);
        if (prior.isPresent()) {
            Instant cutoff = Instant.now().minus(Duration.ofSeconds(COOLDOWN_SECONDS));
            if (prior.get().getCreatedAt().isAfter(cutoff)) {
                long remaining = COOLDOWN_SECONDS
                        - Duration.between(prior.get().getCreatedAt(), Instant.now()).toSeconds();
                throw new CooldownException(Math.max(1, remaining));
            }
        }

        int safeRequests = Math.min(Math.max(1, requests), LoadTestRunner.MAX_REQUESTS);
        int safeConcurrency = Math.min(Math.max(1, concurrency), LoadTestRunner.MAX_CONCURRENCY);

        LoadTestEntity entity = repository.save(
                new LoadTestEntity(projectId, monitorId, targetUrl, safeRequests, safeConcurrency));

        try {
            LoadTestRunner.Result r = runner.run(targetUrl, safeRequests, safeConcurrency);
            String distJson = objectMapper.writeValueAsString(r.statusCodeDistribution());
            entity.complete(r.totalRequests(), r.successfulRequests(), r.failedRequests(),
                    r.avgMs(), r.minMs(), r.maxMs(), r.p95Ms(), distJson);
        } catch (Exception e) {
            entity.fail(e.getMessage() == null ? "load test failed" : e.getMessage());
        }
        return repository.save(entity);
    }

    @Transactional(readOnly = true)
    public Page<LoadTestEntity> list(UUID projectId, int page, int perPage) {
        return repository.findByProjectIdOrderByCreatedAtDesc(projectId,
                PageRequest.of(Math.max(0, page - 1), perPage));
    }

    @Transactional(readOnly = true)
    public LoadTestEntity getById(UUID projectId, UUID id) {
        return repository.findByIdAndProjectId(id, projectId)
                .orElseThrow(() -> new EntityNotFoundException("LoadTest", id));
    }

    public static final class CooldownException extends RuntimeException {
        private final long remainingSeconds;
        public CooldownException(long remainingSeconds) {
            super("Cooldown active. Try again in " + remainingSeconds + "s.");
            this.remainingSeconds = remainingSeconds;
        }
        public long getRemainingSeconds() { return remainingSeconds; }
    }
}
