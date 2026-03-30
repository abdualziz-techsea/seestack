package com.allstak.modules.errors.controller;

import com.allstak.modules.errors.dto.ErrorGroupResponse;
import com.allstak.modules.errors.dto.ErrorStatusUpdateRequest;
import com.allstak.modules.errors.service.ErrorGroupService;
import com.allstak.shared.utils.ApiResponse;
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

    public ErrorController(ErrorGroupService errorGroupService) {
        this.errorGroupService = errorGroupService;
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
    public ResponseEntity<ApiResponse<ErrorGroupResponse>> detail(
            @PathVariable String fingerprint,
            @RequestParam UUID projectId) {

        ErrorGroupResponse response = ErrorGroupResponse.from(
                errorGroupService.getByFingerprint(projectId, fingerprint));
        return ResponseEntity.ok(ApiResponse.ok(response));
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
