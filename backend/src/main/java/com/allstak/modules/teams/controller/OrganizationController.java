package com.allstak.modules.teams.controller;

import com.allstak.modules.teams.dto.OrgCreateRequest;
import com.allstak.modules.teams.dto.OrgResponse;
import com.allstak.modules.teams.service.OrganizationService;
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
@RequestMapping("/api/v1/organizations")
@NullMarked
public class OrganizationController {

    private final OrganizationService orgService;

    public OrganizationController(OrganizationService orgService) {
        this.orgService = orgService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<OrgResponse>> create(@Valid @RequestBody OrgCreateRequest request) {
        var entity = orgService.create(request.name(), request.slug());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(OrgResponse.from(entity)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int perPage) {
        Page<OrgResponse> results = orgService.list(page, perPage).map(OrgResponse::from);
        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "items", results.getContent(),
                "pagination", Map.of("page", results.getNumber() + 1, "perPage", results.getSize(), "total", results.getTotalElements())
        )));
    }

    @GetMapping("/{orgId}")
    public ResponseEntity<ApiResponse<OrgResponse>> detail(@PathVariable UUID orgId) {
        return ResponseEntity.ok(ApiResponse.ok(OrgResponse.from(orgService.getById(orgId))));
    }

    @PutMapping("/{orgId}")
    public ResponseEntity<ApiResponse<OrgResponse>> update(
            @PathVariable UUID orgId, @Valid @RequestBody OrgCreateRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(OrgResponse.from(orgService.update(orgId, request.name(), request.slug()))));
    }

    @DeleteMapping("/{orgId}")
    public ResponseEntity<Void> delete(@PathVariable UUID orgId) {
        orgService.delete(orgId);
        return ResponseEntity.noContent().build();
    }
}
