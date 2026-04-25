package com.seestack.modules.errors.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.seestack.modules.errors.dto.ErrorDetailResponse;
import com.seestack.modules.errors.dto.ErrorGroupResponse;
import com.seestack.modules.errors.dto.ErrorStatusUpdateRequest;
import com.seestack.modules.errors.repository.ErrorEventClickHouseRepository;
import com.seestack.modules.errors.service.ErrorGroupService;
import com.seestack.modules.errors.service.ErrorInsightsService;
import com.seestack.shared.utils.ApiResponse;
import jakarta.validation.Valid;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/errors")
@NullMarked
public class ErrorController {

    private final ErrorGroupService errorGroupService;
    private final ErrorEventClickHouseRepository eventRepository;
    private final ErrorInsightsService insightsService;
    private final ObjectMapper objectMapper;

    public ErrorController(ErrorGroupService errorGroupService,
                           ErrorEventClickHouseRepository eventRepository,
                           ErrorInsightsService insightsService,
                           ObjectMapper objectMapper) {
        this.errorGroupService = errorGroupService;
        this.eventRepository = eventRepository;
        this.insightsService = insightsService;
        this.objectMapper = objectMapper;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> list(
            @RequestParam UUID projectId,
            @RequestParam(required = false) @Nullable String status,
            @RequestParam(required = false) @Nullable String level,
            @RequestParam(required = false) @Nullable String environment,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int perPage) {

        Page<ErrorGroupResponse> results = errorGroupService
                .list(projectId, status, level, environment, page, perPage)
                .map(ErrorGroupResponse::from);

        Map<String, Object> data = Map.of(
                "items", results.getContent(),
                "pagination", Map.of(
                        "page", results.getNumber() + 1,
                        "perPage", results.getSize(),
                        "total", results.getTotalElements()
                )
        );
        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    @GetMapping("/{fingerprint}")
    public ResponseEntity<ApiResponse<ErrorDetailResponse>> detail(
            @PathVariable String fingerprint,
            @RequestParam UUID projectId) {

        var group = errorGroupService.getByFingerprint(projectId, fingerprint);
        var latest = eventRepository.findLatest(projectId, fingerprint);
        var recent = eventRepository.findRecent(projectId, fingerprint, 25);
        var insights = insightsService.compute(group, latest, recent).toMap();
        return ResponseEntity.ok(ApiResponse.ok(
                ErrorDetailResponse.from(group, latest, recent, objectMapper, insights)));
    }

    @PatchMapping("/{fingerprint}/status")
    public ResponseEntity<ApiResponse<ErrorGroupResponse>> updateStatus(
            @PathVariable String fingerprint,
            @Valid @RequestBody ErrorStatusUpdateRequest request) {

        ErrorGroupResponse response = ErrorGroupResponse.from(
                errorGroupService.updateStatus(request.projectId(), fingerprint, request.status()));
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
