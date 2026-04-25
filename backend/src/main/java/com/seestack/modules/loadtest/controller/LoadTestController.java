package com.seestack.modules.loadtest.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.seestack.modules.loadtest.dto.LoadTestCreateRequest;
import com.seestack.modules.loadtest.dto.LoadTestResponse;
import com.seestack.modules.loadtest.service.LoadTestRunner;
import com.seestack.modules.loadtest.service.LoadTestService;
import com.seestack.shared.utils.ApiResponse;
import jakarta.validation.Valid;
import org.jspecify.annotations.NullMarked;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/load-tests")
@NullMarked
public class LoadTestController {

    private final LoadTestService service;
    private final ObjectMapper objectMapper;

    public LoadTestController(LoadTestService service, ObjectMapper objectMapper) {
        this.service = service;
        this.objectMapper = objectMapper;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<LoadTestResponse>> create(
            @Valid @RequestBody LoadTestCreateRequest request) {
        try {
            var entity = service.createAndRun(
                    request.projectId(), request.monitorId(), request.requests(), request.concurrency());
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.ok(LoadTestResponse.from(entity, objectMapper)));
        } catch (LoadTestService.CooldownException e) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(ApiResponse.error(
                    "COOLDOWN_ACTIVE", e.getMessage(),
                    Map.of("remainingSeconds", e.getRemainingSeconds())));
        }
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> list(
            @RequestParam UUID projectId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int perPage) {
        var results = service.list(projectId, page, perPage);
        Map<String, Object> data = Map.of(
                "items", results.getContent().stream()
                        .map(e -> LoadTestResponse.from(e, objectMapper)).toList(),
                "limits", Map.of(
                        "maxRequests", LoadTestRunner.MAX_REQUESTS,
                        "maxConcurrency", LoadTestRunner.MAX_CONCURRENCY,
                        "timeoutSeconds", 5,
                        "cooldownSeconds", LoadTestService.COOLDOWN_SECONDS
                ),
                "pagination", Map.of(
                        "page", results.getNumber() + 1,
                        "perPage", results.getSize(),
                        "total", results.getTotalElements()
                )
        );
        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<LoadTestResponse>> detail(
            @PathVariable UUID id,
            @RequestParam UUID projectId) {
        return ResponseEntity.ok(ApiResponse.ok(
                LoadTestResponse.from(service.getById(projectId, id), objectMapper)));
    }
}
