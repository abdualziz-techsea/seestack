package com.seestack.modules.cron.controller;

import com.seestack.modules.alerts.service.AlertEvaluationService;
import com.seestack.modules.cron.dto.*;
import com.seestack.modules.cron.kafka.CronPingKafkaEvent;
import com.seestack.modules.cron.entity.CronMonitorEntity;
import com.seestack.modules.cron.service.CronMonitorService;
import com.seestack.modules.cron.service.CronPingQueryService;
import com.seestack.shared.utils.ApiResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RestController
@NullMarked
public class CronMonitorController {

    private static final String TOPIC = "seestack.cron_pings";
    private static final Set<String> VALID_STATUSES = Set.of("success", "failed");

    private final CronMonitorService monitorService;
    private final CronPingQueryService pingQueryService;
    private final AlertEvaluationService alertEvaluation;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public CronMonitorController(CronMonitorService monitorService,
                                  CronPingQueryService pingQueryService,
                                  AlertEvaluationService alertEvaluation,
                                  KafkaTemplate<String, String> kafkaTemplate,
                                  ObjectMapper objectMapper) {
        this.monitorService = monitorService;
        this.pingQueryService = pingQueryService;
        this.alertEvaluation = alertEvaluation;
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
    }

    // ── CRUD ──────────────────────────────────────────────────

    @PostMapping("/api/v1/cron-monitors")
    public ResponseEntity<ApiResponse<CronMonitorResponse>> create(
            @Valid @RequestBody CreateCronMonitorRequest request) {
        try {
            var entity = monitorService.create(
                    request.projectId(), request.name(), request.slug(),
                    request.schedule(), request.gracePeriodMin());
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.ok(monitorService.toResponse(entity)));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.error("CONFLICT", e.getMessage(), null));
        }
    }

    @GetMapping("/api/v1/cron-monitors")
    public ResponseEntity<ApiResponse<Map<String, Object>>> list(@RequestParam UUID projectId) {
        var monitors = monitorService.list(projectId);
        var items = monitors.stream().map(monitorService::toResponse).toList();
        return ResponseEntity.ok(ApiResponse.ok(Map.of("items", items)));
    }

    @GetMapping("/api/v1/cron-monitors/{id}")
    public ResponseEntity<ApiResponse<CronMonitorResponse>> detail(
            @PathVariable UUID id, @RequestParam UUID projectId) {
        var entity = monitorService.getById(projectId, id);
        return ResponseEntity.ok(ApiResponse.ok(monitorService.toResponse(entity)));
    }

    @PutMapping("/api/v1/cron-monitors/{id}")
    public ResponseEntity<ApiResponse<CronMonitorResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody CreateCronMonitorRequest request) {
        var existing = monitorService.getById(request.projectId(), id);
        if (!existing.getSlug().equals(request.slug())) {
            return ResponseEntity.unprocessableEntity()
                    .body(ApiResponse.error("VALIDATION_ERROR", "Slug cannot be changed after creation", null));
        }
        var entity = monitorService.update(request.projectId(), id, request.name(), request.schedule(), request.gracePeriodMin());
        return ResponseEntity.ok(ApiResponse.ok(monitorService.toResponse(entity)));
    }

    @DeleteMapping("/api/v1/cron-monitors/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id, @RequestParam UUID projectId) {
        monitorService.delete(projectId, id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/v1/cron-monitors/{id}/history")
    public ResponseEntity<ApiResponse<Map<String, Object>>> history(
            @PathVariable UUID id,
            @RequestParam UUID projectId,
            @RequestParam(required = false) @Nullable String status,
            @RequestParam(required = false) @Nullable Instant from,
            @RequestParam(required = false) @Nullable Instant to,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int perPage) {
        monitorService.getById(projectId, id); // verify exists
        perPage = Math.min(perPage, 200);
        var result = pingQueryService.getHistory(id, status, from, to, page, perPage);
        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "items", result.items(),
                "pagination", Map.of("page", page, "perPage", perPage, "total", result.total())
        )));
    }

    // ── Heartbeat Ingest ──────────────────────────────────────

    @PostMapping("/ingest/v1/heartbeat")
    public ResponseEntity<Map<String, Object>> heartbeat(
            @Valid @RequestBody HeartbeatRequest request,
            HttpServletRequest httpRequest) {

        UUID projectId = (UUID) httpRequest.getAttribute("seestack.projectId");
        if (projectId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("ok", false, "code", "UNAUTHORIZED", "message", "Missing API key"));
        }

        String normalizedStatus = request.status().toLowerCase();
        if (!VALID_STATUSES.contains(normalizedStatus)) {
            return ResponseEntity.unprocessableEntity()
                    .body(Map.of("ok", false, "code", "VALIDATION_ERROR", "message", "Status must be 'success' or 'failed'"));
        }

        CronMonitorEntity monitor = monitorService.getBySlug(projectId, request.slug());
        if (monitor == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("ok", false, "code", "NOT_FOUND",
                            "message", "No cron monitor found with slug: " + request.slug()));
        }

        var event = new CronPingKafkaEvent(
                monitor.getId(), projectId, normalizedStatus,
                request.durationMs(),
                request.message() != null ? request.message() : "",
                System.currentTimeMillis()
        );

        try {
            kafkaTemplate.send(TOPIC, monitor.getId().toString(), objectMapper.writeValueAsString(event));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("ok", false, "message", "Failed to publish event"));
        }

        if ("failed".equals(normalizedStatus)) {
            alertEvaluation.evaluateJobFailed(monitor.getId(), projectId,
                    request.message() != null ? request.message() : "Job reported failure");
        }

        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(Map.of("ok", true, "monitorId", monitor.getId().toString()));
    }
}
