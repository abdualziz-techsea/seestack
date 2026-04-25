package com.seestack.modules.security.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.seestack.modules.security.dto.SecurityScanCreateRequest;
import com.seestack.modules.security.dto.SecurityScanResponse;
import com.seestack.modules.security.service.PortScanner;
import com.seestack.modules.security.service.SecurityAnalyzer;
import com.seestack.modules.security.service.SecurityScanService;
import com.seestack.shared.utils.ApiResponse;
import jakarta.validation.Valid;
import org.jspecify.annotations.NullMarked;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/security-scans")
@NullMarked
public class SecurityScanController {

    private final SecurityScanService service;
    private final ObjectMapper objectMapper;

    public SecurityScanController(SecurityScanService service, ObjectMapper objectMapper) {
        this.service = service;
        this.objectMapper = objectMapper;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SecurityScanResponse>> create(
            @Valid @RequestBody SecurityScanCreateRequest request) {
        var entity = service.createAndRun(request.target(), request.projectId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(SecurityScanResponse.from(entity, objectMapper)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int perPage) {
        var results = service.list(page, perPage);
        Map<String, Object> data = Map.of(
                "items", results.getContent().stream()
                        .map(e -> SecurityScanResponse.from(e, objectMapper)).toList(),
                "scanType", "Basic Security Analysis",
                "scannedPorts", PortScanner.COMMON_PORTS,
                "checkedHeaders", SecurityAnalyzer.CHECKED_HEADERS,
                "pagination", Map.of(
                        "page", results.getNumber() + 1,
                        "perPage", results.getSize(),
                        "total", results.getTotalElements()
                )
        );
        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SecurityScanResponse>> detail(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(
                SecurityScanResponse.from(service.getById(id), objectMapper)));
    }
}
