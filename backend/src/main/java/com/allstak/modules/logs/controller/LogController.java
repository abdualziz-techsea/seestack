package com.allstak.modules.logs.controller;

import com.allstak.modules.logs.repository.LogClickHouseRepository.LogQueryResult;
import com.allstak.modules.logs.service.LogService;
import com.allstak.shared.utils.ApiResponse;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/logs")
@NullMarked
public class LogController {

    private final LogService logService;

    public LogController(LogService logService) {
        this.logService = logService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> list(
            @RequestParam UUID projectId,
            @RequestParam(required = false) @Nullable String level,
            @RequestParam(required = false) @Nullable String service,
            @RequestParam(required = false) @Nullable String timeRange,
            @RequestParam(required = false) @Nullable String search,
            @RequestParam(required = false) @Nullable Instant start,
            @RequestParam(required = false) @Nullable Instant end,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int perPage) {

        LogQueryResult result = logService.search(projectId, level, service, timeRange, search, start, end, page, perPage);

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
