package com.seestack.modules.alerts.controller;

import com.seestack.modules.alerts.dto.NotificationLogResponse;
import com.seestack.modules.alerts.repository.NotificationLogRepository;
import com.seestack.shared.utils.ApiResponse;
import jakarta.transaction.Transactional;
import org.jspecify.annotations.NullMarked;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
@NullMarked
public class NotificationController {

    private final NotificationLogRepository repository;

    public NotificationController(NotificationLogRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> list(
            @RequestParam UUID projectId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int perPage) {
        Page<NotificationLogResponse> results = repository.findByProjectId(projectId,
                        PageRequest.of(Math.max(0, page - 1), perPage, Sort.by(Sort.Direction.DESC, "sentAt")))
                .map(NotificationLogResponse::from);
        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "items", results.getContent(),
                "pagination", Map.of(
                        "page", results.getNumber() + 1,
                        "perPage", results.getSize(),
                        "total", results.getTotalElements())
        )));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Map<String, Object>>> unreadCount(@RequestParam UUID projectId) {
        long count = repository.countByProjectIdAndIsReadFalse(projectId);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("count", count)));
    }

    @PatchMapping("/{id}/read")
    @Transactional
    public ResponseEntity<ApiResponse<NotificationLogResponse>> markRead(@PathVariable UUID id) {
        var entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));
        entity.setRead(true);
        repository.save(entity);
        return ResponseEntity.ok(ApiResponse.ok(NotificationLogResponse.from(entity)));
    }

    @PatchMapping("/read-all")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> markAllRead(@RequestParam UUID projectId) {
        repository.markAllReadByProjectId(projectId);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("success", true)));
    }
}
