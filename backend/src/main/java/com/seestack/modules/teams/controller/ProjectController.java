package com.seestack.modules.teams.controller;

import com.seestack.modules.teams.dto.ProjectCreateRequest;
import com.seestack.modules.teams.dto.ProjectResponse;
import com.seestack.modules.teams.service.ProjectService;
import com.seestack.shared.security.CurrentUser;
import com.seestack.shared.utils.ApiResponse;
import jakarta.validation.Valid;
import org.jspecify.annotations.NullMarked;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
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
        var result = projectService.create(CurrentUser.requireUserId(), request.name(), request.platform());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(
                ProjectResponse.afterCreate(result.project(), result.key(), result.rawKey())));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProjectResponse>>> list() {
        UUID userId = CurrentUser.requireUserId();
        List<ProjectResponse> items = projectService.listAll(userId).stream()
                .map(p -> ProjectResponse.fromWithPrefix(p, projectService.latestKey(p.getId())))
                .toList();
        return ResponseEntity.ok(ApiResponse.ok(items));
    }

    @GetMapping("/{projectId}")
    public ResponseEntity<ApiResponse<ProjectResponse>> detail(@PathVariable UUID projectId) {
        UUID userId = CurrentUser.requireUserId();
        var project = projectService.getById(userId, projectId);
        return ResponseEntity.ok(ApiResponse.ok(
                ProjectResponse.fromWithPrefix(project, projectService.latestKey(project.getId()))));
    }

    @DeleteMapping("/{projectId}")
    public ResponseEntity<Void> delete(@PathVariable UUID projectId) {
        projectService.delete(CurrentUser.requireUserId(), projectId);
        return ResponseEntity.noContent().build();
    }
}
