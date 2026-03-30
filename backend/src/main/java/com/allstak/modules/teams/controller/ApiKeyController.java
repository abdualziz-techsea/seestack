package com.allstak.modules.teams.controller;

import com.allstak.modules.teams.dto.ApiKeyCreateRequest;
import com.allstak.modules.teams.dto.ApiKeyResponse;
import com.allstak.modules.teams.service.ApiKeyManagementService;
import com.allstak.shared.utils.ApiResponse;
import jakarta.validation.Valid;
import org.jspecify.annotations.NullMarked;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/projects/{projectId}/api-keys")
@NullMarked
public class ApiKeyController {

    private final ApiKeyManagementService apiKeyService;

    public ApiKeyController(ApiKeyManagementService apiKeyService) {
        this.apiKeyService = apiKeyService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ApiKeyResponse>> create(
            @PathVariable UUID projectId, @Valid @RequestBody ApiKeyCreateRequest request) {
        var result = apiKeyService.create(projectId, request.name());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(ApiKeyResponse.withKey(result.entity(), result.rawKey())));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> list(
            @PathVariable UUID projectId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int perPage) {
        Page<ApiKeyResponse> results = apiKeyService.list(projectId, page, perPage).map(ApiKeyResponse::from);
        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "items", results.getContent(),
                "pagination", Map.of("page", results.getNumber() + 1, "perPage", results.getSize(), "total", results.getTotalElements())
        )));
    }

    @PutMapping("/{keyId}")
    public ResponseEntity<ApiResponse<ApiKeyResponse>> rename(
            @PathVariable UUID projectId, @PathVariable UUID keyId,
            @Valid @RequestBody ApiKeyCreateRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(
                ApiKeyResponse.from(apiKeyService.rename(projectId, keyId, request.name()))));
    }

    @DeleteMapping("/{keyId}")
    public ResponseEntity<Void> delete(@PathVariable UUID projectId, @PathVariable UUID keyId) {
        apiKeyService.delete(projectId, keyId);
        return ResponseEntity.noContent().build();
    }
}
