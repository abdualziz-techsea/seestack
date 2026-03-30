package com.allstak.modules.ssh.controller;

import com.allstak.modules.ssh.dto.SshAuditResponse;
import com.allstak.modules.ssh.dto.SshServerCreateRequest;
import com.allstak.modules.ssh.dto.SshServerResponse;
import com.allstak.modules.ssh.dto.SshServerUpdateRequest;
import com.allstak.modules.ssh.repository.SshAuditClickHouseRepository;
import com.allstak.modules.ssh.service.SshServerService;
import com.allstak.shared.utils.ApiResponse;
import jakarta.validation.Valid;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/ssh/servers")
@NullMarked
public class SshServerController {

    private final SshServerService sshServerService;
    private final SshAuditClickHouseRepository auditRepository;

    public SshServerController(SshServerService sshServerService,
                                SshAuditClickHouseRepository auditRepository) {
        this.sshServerService = sshServerService;
        this.auditRepository = auditRepository;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SshServerResponse>> create(
            @Valid @RequestBody SshServerCreateRequest request) {
        var entity = sshServerService.create(
                request.projectId(), request.name(), request.host(), request.port(),
                request.username(), request.privateKey());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(SshServerResponse.from(entity)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> list(
            @RequestParam UUID projectId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int perPage) {

        Page<SshServerResponse> results = sshServerService.list(projectId, page, perPage)
                .map(SshServerResponse::from);

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

    @GetMapping("/{serverId}")
    public ResponseEntity<ApiResponse<SshServerResponse>> detail(
            @PathVariable UUID serverId,
            @RequestParam UUID projectId) {
        return ResponseEntity.ok(ApiResponse.ok(
                SshServerResponse.from(sshServerService.getById(projectId, serverId))));
    }

    @PutMapping("/{serverId}")
    public ResponseEntity<ApiResponse<SshServerResponse>> update(
            @PathVariable UUID serverId,
            @Valid @RequestBody SshServerUpdateRequest request) {
        var entity = sshServerService.update(
                request.projectId(), serverId,
                request.name(), request.host(), request.port(),
                request.username(), request.privateKey());
        return ResponseEntity.ok(ApiResponse.ok(SshServerResponse.from(entity)));
    }

    @DeleteMapping("/{serverId}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID serverId,
            @RequestParam UUID projectId) {
        sshServerService.delete(projectId, serverId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{serverId}/audit")
    public ResponseEntity<ApiResponse<Map<String, Object>>> auditLog(
            @PathVariable UUID serverId,
            @RequestParam UUID projectId,
            @RequestParam(required = false, defaultValue = "24h") @Nullable String timeRange,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int perPage) {

        sshServerService.getById(projectId, serverId);
        var result = auditRepository.getAuditLog(serverId, timeRange, page, perPage);

        Map<String, Object> data = Map.of(
                "items", result.items(),
                "pagination", Map.of(
                        "page", page,
                        "perPage", perPage,
                        "total", result.total()
                )
        );
        return ResponseEntity.ok(ApiResponse.ok(data));
    }
}
