package com.seestack.modules.flags.controller;

import com.seestack.modules.flags.dto.*;
import com.seestack.modules.flags.service.FeatureFlagService;
import com.seestack.shared.utils.ApiResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/flags")
@NullMarked
public class FeatureFlagController {

    private final FeatureFlagService flagService;
    private final ObjectMapper objectMapper;

    public FeatureFlagController(FeatureFlagService flagService, ObjectMapper objectMapper) {
        this.flagService = flagService;
        this.objectMapper = objectMapper;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<FlagResponse>> create(
            @RequestParam UUID projectId,
            @Valid @RequestBody CreateFlagRequest request) {
        try {
            var entity = flagService.create(request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.ok(flagService.toResponse(entity)));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.error("CONFLICT", e.getMessage(), null));
        }
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> list(@RequestParam UUID projectId) {
        var flags = flagService.list(projectId);
        var items = flags.stream().map(flagService::toResponse).toList();
        return ResponseEntity.ok(ApiResponse.ok(Map.of("items", items)));
    }

    @GetMapping("/{key}")
    public ResponseEntity<ApiResponse<FlagResponse>> detail(
            @PathVariable String key, @RequestParam UUID projectId) {
        return ResponseEntity.ok(ApiResponse.ok(flagService.toResponse(flagService.getByKey(projectId, key))));
    }

    @PutMapping("/{key}")
    public ResponseEntity<ApiResponse<FlagResponse>> update(
            @PathVariable String key,
            @RequestParam UUID projectId,
            @Valid @RequestBody UpdateFlagRequest request) {
        var entity = flagService.update(projectId, key, request);
        return ResponseEntity.ok(ApiResponse.ok(flagService.toResponse(entity)));
    }

    @DeleteMapping("/{key}")
    public ResponseEntity<Void> delete(@PathVariable String key, @RequestParam UUID projectId) {
        flagService.delete(projectId, key);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{key}/toggle")
    public ResponseEntity<ApiResponse<FlagResponse>> toggle(
            @PathVariable String key, @RequestParam UUID projectId) {
        var entity = flagService.toggle(projectId, key);
        return ResponseEntity.ok(ApiResponse.ok(flagService.toResponse(entity)));
    }

    @GetMapping("/{key}/audit")
    public ResponseEntity<ApiResponse<Map<String, Object>>> audit(
            @PathVariable String key, @RequestParam UUID projectId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int perPage) {
        var flag = flagService.getByKey(projectId, key);
        var results = flagService.getAuditLog(flag.getId(), projectId, page, Math.min(perPage, 200));
        var items = results.getContent().stream().map(e -> new FlagAuditEntry(
                e.getId(), e.getAction(), e.getOldValue(), e.getNewValue(), e.getUserId(), e.getCreatedAt()
        )).toList();
        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "items", items,
                "pagination", Map.of("page", results.getNumber() + 1, "perPage", results.getSize(), "total", results.getTotalElements())
        )));
    }

    // ── Evaluation ──────────────────────────────────────────

    @GetMapping("/evaluate")
    public ResponseEntity<ApiResponse<Map<String, Object>>> evaluateAll(
            @RequestParam UUID projectId,
            @RequestParam @Nullable String userId,
            @RequestParam(defaultValue = "{}") String attributes) {
        Map<String, Object> attrs = parseAttributes(attributes);
        var results = flagService.evaluateAll(projectId, userId, attrs);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("flags", results)));
    }

    @GetMapping("/{key}/evaluate")
    public ResponseEntity<ApiResponse<FlagEvaluationResult>> evaluateSingle(
            @PathVariable String key,
            @RequestParam UUID projectId,
            @RequestParam @Nullable String userId,
            @RequestParam(defaultValue = "{}") String attributes) {
        Map<String, Object> attrs = parseAttributes(attributes);
        var result = flagService.evaluateSingle(projectId, key, userId, attrs);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> parseAttributes(String json) {
        try {
            return objectMapper.readValue(json, Map.class);
        } catch (Exception e) {
            return Map.of();
        }
    }
}
