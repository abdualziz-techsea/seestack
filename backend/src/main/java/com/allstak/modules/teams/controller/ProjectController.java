package com.allstak.modules.teams.controller;

import com.allstak.modules.teams.dto.ProjectCreateRequest;
import com.allstak.modules.teams.dto.ProjectResponse;
import com.allstak.modules.teams.service.ProjectService;
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
@RequestMapping("/api/v1/projects")
@NullMarked
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ProjectResponse>> create(@Valid @RequestBody ProjectCreateRequest request) {
        var entity = projectService.create(request.orgId(), request.name(), request.slug(), request.platform());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(ProjectResponse.from(entity)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> list(
            @RequestParam UUID orgId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int perPage) {
        Page<ProjectResponse> results = projectService.list(orgId, page, perPage).map(ProjectResponse::from);
        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "items", results.getContent(),
                "pagination", Map.of("page", results.getNumber() + 1, "perPage", results.getSize(), "total", results.getTotalElements())
        )));
    }

    @GetMapping("/{projectId}")
    public ResponseEntity<ApiResponse<ProjectResponse>> detail(
            @PathVariable UUID projectId, @RequestParam UUID orgId) {
        return ResponseEntity.ok(ApiResponse.ok(ProjectResponse.from(projectService.getById(orgId, projectId))));
    }

    @PutMapping("/{projectId}")
    public ResponseEntity<ApiResponse<ProjectResponse>> update(
            @PathVariable UUID projectId, @Valid @RequestBody ProjectCreateRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(ProjectResponse.from(
                projectService.update(request.orgId(), projectId, request.name(), request.slug(), request.platform()))));
    }

    @DeleteMapping("/{projectId}")
    public ResponseEntity<Void> delete(@PathVariable UUID projectId, @RequestParam UUID orgId) {
        projectService.delete(orgId, projectId);
        return ResponseEntity.noContent().build();
    }
}
