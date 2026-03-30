package com.allstak.modules.alerts.controller;

import com.allstak.modules.alerts.dto.AlertRuleRequest;
import com.allstak.modules.alerts.dto.AlertRuleResponse;
import com.allstak.modules.alerts.dto.NotificationLogResponse;
import com.allstak.modules.alerts.repository.NotificationLogRepository;
import com.allstak.modules.alerts.service.AlertRuleService;
import com.allstak.shared.utils.ApiResponse;
import jakarta.validation.Valid;
import org.jspecify.annotations.NullMarked;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@NullMarked
public class AlertRuleController {

    private final AlertRuleService ruleService;
    private final NotificationLogRepository logRepository;

    public AlertRuleController(AlertRuleService ruleService,
                                NotificationLogRepository logRepository) {
        this.ruleService = ruleService;
        this.logRepository = logRepository;
    }

    @PostMapping("/alert-rules")
    public ResponseEntity<ApiResponse<AlertRuleResponse>> create(
            @Valid @RequestBody AlertRuleRequest request) {
        var entity = ruleService.create(request.projectId(), request.name(), request.triggerType(),
                request.triggerConfig(), request.severityFilter(), request.quietHoursEnabled(),
                request.quietStart(), request.quietEnd(), request.channels());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(AlertRuleResponse.from(entity)));
    }

    @GetMapping("/alert-rules")
    public ResponseEntity<ApiResponse<Map<String, Object>>> list(
            @RequestParam UUID projectId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int perPage) {
        Page<AlertRuleResponse> results = ruleService.list(projectId, page, perPage)
                .map(AlertRuleResponse::from);
        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "items", results.getContent(),
                "pagination", Map.of("page", results.getNumber() + 1, "perPage", results.getSize(),
                        "total", results.getTotalElements())
        )));
    }

    @GetMapping("/alert-rules/{id}")
    public ResponseEntity<ApiResponse<AlertRuleResponse>> detail(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(AlertRuleResponse.from(ruleService.getById(id))));
    }

    @PatchMapping("/alert-rules/{id}")
    public ResponseEntity<ApiResponse<AlertRuleResponse>> update(
            @PathVariable UUID id, @Valid @RequestBody AlertRuleRequest request) {
        var entity = ruleService.update(id, request.name(), request.triggerType(),
                request.triggerConfig(), request.severityFilter(), request.quietHoursEnabled(),
                request.quietStart(), request.quietEnd(), request.channels());
        return ResponseEntity.ok(ApiResponse.ok(AlertRuleResponse.from(entity)));
    }

    @DeleteMapping("/alert-rules/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        ruleService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PatchMapping("/alert-rules/{id}/toggle")
    public ResponseEntity<ApiResponse<Map<String, Object>>> toggle(@PathVariable UUID id) {
        var entity = ruleService.toggle(id);
        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "id", entity.getId(), "isEnabled", entity.isEnabled())));
    }

    @GetMapping("/notification-log")
    public ResponseEntity<ApiResponse<Map<String, Object>>> notificationLog(
            @RequestParam UUID projectId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int perPage) {
        Page<NotificationLogResponse> results = logRepository.findByProjectId(projectId,
                        PageRequest.of(Math.max(0, page - 1), perPage, Sort.by(Sort.Direction.DESC, "sentAt")))
                .map(NotificationLogResponse::from);
        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "items", results.getContent(),
                "pagination", Map.of("page", results.getNumber() + 1, "perPage", results.getSize(),
                        "total", results.getTotalElements())
        )));
    }
}
