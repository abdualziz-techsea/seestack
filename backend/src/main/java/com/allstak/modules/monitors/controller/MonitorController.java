package com.allstak.modules.monitors.controller;

import com.allstak.modules.monitors.dto.*;
import com.allstak.modules.monitors.repository.MonitorCheckClickHouseRepository;
import com.allstak.modules.monitors.service.MonitorService;
import com.allstak.shared.utils.ApiResponse;
import jakarta.validation.Valid;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/monitors")
@NullMarked
public class MonitorController {

    private final MonitorService monitorService;
    private final MonitorCheckClickHouseRepository checkRepository;

    public MonitorController(MonitorService monitorService,
                              MonitorCheckClickHouseRepository checkRepository) {
        this.monitorService = monitorService;
        this.checkRepository = checkRepository;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<MonitorResponse>> create(
            @Valid @RequestBody MonitorCreateRequest request) {
        var entity = monitorService.create(
                request.projectId(), request.name(), request.url(), request.intervalMinutes());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(MonitorResponse.from(entity)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> list(
            @RequestParam UUID projectId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int perPage) {

        var results = monitorService.list(projectId, page, perPage);
        var monitors = results.getContent();

        // Enrich with latest check status from ClickHouse
        var monitorIds = monitors.stream().map(e -> e.getId()).toList();
        var statusMap = checkRepository.getLatestStatusBatch(monitorIds).stream()
                .collect(Collectors.toMap(
                        MonitorCheckClickHouseRepository.MonitorStatusSummary::monitorId,
                        s -> s
                ));

        List<MonitorListItemResponse> enriched = monitors.stream().map(entity -> {
            var summary = statusMap.get(entity.getId());
            String status;
            int responseTime = 0;
            double uptime = 0.0;
            java.time.Instant lastChecked = null;

            if (!entity.isActive()) {
                status = "paused";
            } else if (summary == null) {
                status = "pending";
            } else {
                status = summary.lastStatus() == 1 ? "up" : "down";
                responseTime = summary.lastResponseTimeMs();
                uptime = summary.uptimePercentage();
                lastChecked = summary.lastCheckedAt();
            }

            return new MonitorListItemResponse(
                    entity.getId(), entity.getProjectId(), entity.getName(), entity.getUrl(),
                    entity.getIntervalMinutes(), entity.isActive(), entity.getCreatedAt(),
                    status, responseTime, uptime, lastChecked
            );
        }).toList();

        Map<String, Object> data = Map.of(
                "items", enriched,
                "pagination", Map.of(
                        "page", results.getNumber() + 1,
                        "perPage", results.getSize(),
                        "total", results.getTotalElements()
                )
        );
        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    @GetMapping("/{monitorId}")
    public ResponseEntity<ApiResponse<MonitorResponse>> detail(
            @PathVariable UUID monitorId,
            @RequestParam UUID projectId) {
        return ResponseEntity.ok(ApiResponse.ok(
                MonitorResponse.from(monitorService.getById(projectId, monitorId))));
    }

    @PutMapping("/{monitorId}")
    public ResponseEntity<ApiResponse<MonitorResponse>> update(
            @PathVariable UUID monitorId,
            @Valid @RequestBody MonitorUpdateRequest request) {
        var entity = monitorService.update(
                request.projectId(), monitorId,
                request.name(), request.url(), request.intervalMinutes(), request.isActive());
        return ResponseEntity.ok(ApiResponse.ok(MonitorResponse.from(entity)));
    }

    @DeleteMapping("/{monitorId}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID monitorId,
            @RequestParam UUID projectId) {
        monitorService.delete(projectId, monitorId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{monitorId}/checks")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checks(
            @PathVariable UUID monitorId,
            @RequestParam UUID projectId,
            @RequestParam(required = false, defaultValue = "24h") @Nullable String timeRange) {

        // Verify monitor exists
        monitorService.getById(projectId, monitorId);

        var result = checkRepository.getCheckHistory(monitorId, timeRange);

        Map<String, Object> data = Map.of(
                "monitorId", monitorId.toString(),
                "uptimePercentage", result.uptimePercentage(),
                "totalChecks", result.totalChecks(),
                "checks", result.checks()
        );
        return ResponseEntity.ok(ApiResponse.ok(data));
    }
}
