package com.seestack.modules.teams.controller;

import com.seestack.modules.teams.dto.MemberRequest;
import com.seestack.modules.teams.dto.MemberResponse;
import com.seestack.modules.teams.service.ProjectMemberService;
import com.seestack.shared.utils.ApiResponse;
import jakarta.validation.Valid;
import org.jspecify.annotations.NullMarked;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/projects/{projectId}/members")
@NullMarked
public class ProjectMemberController {

    private final ProjectMemberService memberService;

    public ProjectMemberController(ProjectMemberService memberService) {
        this.memberService = memberService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<MemberResponse>> addMember(
            @PathVariable UUID projectId, @Valid @RequestBody MemberRequest request) {
        var entity = memberService.addMember(projectId, request.userId(),
                request.canErrors(), request.canLogs(), request.canMonitors(), request.canSsh());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(MemberResponse.from(entity)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> list(
            @PathVariable UUID projectId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int perPage) {
        Page<MemberResponse> results = memberService.list(projectId, page, perPage).map(MemberResponse::from);
        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "items", results.getContent(),
                "pagination", Map.of("page", results.getNumber() + 1, "perPage", results.getSize(), "total", results.getTotalElements())
        )));
    }

    @PutMapping("/{memberId}")
    public ResponseEntity<ApiResponse<MemberResponse>> updatePermissions(
            @PathVariable UUID projectId, @PathVariable UUID memberId,
            @Valid @RequestBody MemberRequest request) {
        var entity = memberService.updatePermissions(projectId, memberId,
                request.canErrors(), request.canLogs(), request.canMonitors(), request.canSsh());
        return ResponseEntity.ok(ApiResponse.ok(MemberResponse.from(entity)));
    }

    @DeleteMapping("/{memberId}")
    public ResponseEntity<Void> removeMember(
            @PathVariable UUID projectId, @PathVariable UUID memberId) {
        memberService.removeMember(projectId, memberId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/check")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkPermission(
            @PathVariable UUID projectId,
            @RequestParam UUID userId,
            @RequestParam String permission) {
        boolean allowed = memberService.hasPermission(projectId, userId, permission);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("allowed", allowed)));
    }
}
