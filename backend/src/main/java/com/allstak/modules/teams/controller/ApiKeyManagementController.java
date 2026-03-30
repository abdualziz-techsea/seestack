package com.allstak.modules.teams.controller;

import com.allstak.modules.teams.entity.ApiKeyEntity;
import com.allstak.modules.teams.repository.ApiKeyManagementRepository;
import com.allstak.modules.teams.service.ApiKeyGeneratorService;
import com.allstak.shared.exception.EntityNotFoundException;
import com.allstak.shared.utils.ApiResponse;
import org.jspecify.annotations.NullMarked;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * Standalone API key management at /api/v1/api-keys.
 * Uses environment-aware key generation (ask_live_ / ask_test_).
 */
@RestController
@RequestMapping("/api/v1/api-keys")
@NullMarked
public class ApiKeyManagementController {

    private final ApiKeyManagementRepository repository;
    private final ApiKeyGeneratorService generator;

    public ApiKeyManagementController(ApiKeyManagementRepository repository,
                                       ApiKeyGeneratorService generator) {
        this.repository = repository;
        this.generator = generator;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> create(@RequestBody Map<String, String> body) {
        UUID projectId = UUID.fromString(body.get("projectId"));
        String name = body.getOrDefault("name", "Unnamed Key");
        String environment = body.getOrDefault("environment", "production");

        String rawKey = generator.generateKey(environment);
        String hash = generator.hashKey(rawKey);
        String prefix = generator.extractPrefix(rawKey);

        var entity = new ApiKeyEntity(projectId, hash, name);
        repository.save(entity);

        // Update prefix and environment via JDBC since entity may not have the new columns mapped
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(Map.of(
                "id", entity.getId(),
                "projectId", projectId,
                "name", name,
                "key", rawKey,
                "keyPrefix", prefix,
                "environment", environment,
                "createdAt", entity.getCreatedAt()
        )));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> list(
            @RequestParam UUID projectId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int perPage) {
        Page<Map<String, Object>> results = repository.findByProjectId(projectId,
                        PageRequest.of(Math.max(0, page - 1), perPage, Sort.by(Sort.Direction.DESC, "createdAt")))
                .map(e -> Map.<String, Object>of(
                        "id", e.getId(),
                        "projectId", e.getProjectId(),
                        "name", e.getName() != null ? e.getName() : "",
                        "lastUsedAt", e.getLastUsedAt() != null ? e.getLastUsedAt().toString() : "never",
                        "createdAt", e.getCreatedAt().toString()
                ));
        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "items", results.getContent(),
                "pagination", Map.of("page", results.getNumber() + 1, "perPage", results.getSize(),
                        "total", results.getTotalElements())
        )));
    }

    @PatchMapping("/{keyId}")
    public ResponseEntity<ApiResponse<Map<String, String>>> rename(
            @PathVariable UUID keyId, @RequestBody Map<String, String> body) {
        String name = body.get("name");
        ApiKeyEntity entity = repository.findById(keyId)
                .orElseThrow(() -> new EntityNotFoundException("ApiKey", keyId));
        entity.setName(name);
        repository.save(entity);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("id", entity.getId().toString(), "name", name)));
    }

    @DeleteMapping("/{keyId}")
    public ResponseEntity<ApiResponse<Map<String, String>>> delete(@PathVariable UUID keyId) {
        ApiKeyEntity entity = repository.findById(keyId)
                .orElseThrow(() -> new EntityNotFoundException("ApiKey", keyId));
        repository.delete(entity);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("status", "revoked")));
    }
}
