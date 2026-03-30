package com.allstak.modules.requests.controller;

import com.allstak.modules.requests.dto.HttpRequestResponse;
import com.allstak.modules.requests.dto.HttpRequestStatsResponse;
import com.allstak.modules.requests.dto.TopHostEntry;
import com.allstak.modules.requests.service.HttpRequestQueryService;
import com.allstak.shared.utils.ApiResponse;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/http-requests")
@NullMarked
public class HttpRequestController {

    private final HttpRequestQueryService queryService;

    public HttpRequestController(HttpRequestQueryService queryService) {
        this.queryService = queryService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> list(
            @RequestParam UUID projectId,
            @RequestParam(required = false) @Nullable String direction,
            @RequestParam(required = false) @Nullable String method,
            @RequestParam(required = false) @Nullable String statusGroup,
            @RequestParam(required = false) @Nullable String path,
            @RequestParam(required = false) @Nullable Instant from,
            @RequestParam(required = false) @Nullable Instant to,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int perPage) {

        perPage = Math.min(perPage, 200);
        var result = queryService.list(projectId, direction, method, statusGroup, path, from, to, page, perPage);

        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "items", result.items(),
                "pagination", Map.of("page", page, "perPage", perPage, "total", result.total())
        )));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<HttpRequestStatsResponse>> stats(
            @RequestParam UUID projectId,
            @RequestParam(required = false) @Nullable Instant from,
            @RequestParam(required = false) @Nullable Instant to) {

        return ResponseEntity.ok(ApiResponse.ok(queryService.stats(projectId, from, to)));
    }

    @GetMapping("/top-hosts")
    public ResponseEntity<ApiResponse<Map<String, Object>>> topHosts(
            @RequestParam UUID projectId,
            @RequestParam(required = false) @Nullable Instant from,
            @RequestParam(required = false) @Nullable Instant to) {

        List<TopHostEntry> items = queryService.topHosts(projectId, from, to);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("items", items)));
    }

    @GetMapping("/by-trace")
    public ResponseEntity<ApiResponse<Map<String, Object>>> byTrace(
            @RequestParam String traceId,
            @RequestParam UUID projectId) {

        List<HttpRequestResponse> items = queryService.byTrace(traceId, projectId);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("items", items)));
    }
}
