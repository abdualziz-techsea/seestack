package com.seestack.modules.ai.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.seestack.modules.ai.dto.AiAnalysisResponse;
import com.seestack.modules.ai.service.ErrorAiAnalysisService;
import com.seestack.modules.errors.dto.ErrorDetailResponse;
import com.seestack.modules.errors.repository.ErrorEventClickHouseRepository;
import com.seestack.modules.errors.service.ErrorGroupService;
import com.seestack.shared.utils.ApiResponse;
import org.jspecify.annotations.NullMarked;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/errors")
@NullMarked
public class ErrorAiAnalysisController {

    private static final Logger log = LoggerFactory.getLogger(ErrorAiAnalysisController.class);

    private final ErrorAiAnalysisService aiService;
    private final ErrorGroupService errorGroupService;
    private final ErrorEventClickHouseRepository eventRepository;
    private final ObjectMapper objectMapper;

    public ErrorAiAnalysisController(ErrorAiAnalysisService aiService,
                                     ErrorGroupService errorGroupService,
                                     ErrorEventClickHouseRepository eventRepository,
                                     ObjectMapper objectMapper) {
        this.aiService = aiService;
        this.errorGroupService = errorGroupService;
        this.eventRepository = eventRepository;
        this.objectMapper = objectMapper;
    }

    @PostMapping("/{fingerprint}/ai-analysis")
    public ResponseEntity<ApiResponse<AiAnalysisResponse>> analyze(
            @PathVariable String fingerprint,
            @RequestParam UUID projectId,
            @RequestParam(defaultValue = "false") boolean force) {

        if (!aiService.isConfigured()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(ApiResponse.error(
                    "AI_NOT_CONFIGURED",
                    "AI analysis is not configured. Set OPENAI_API_KEY to enable this feature.",
                    null));
        }

        var group = errorGroupService.getByFingerprint(projectId, fingerprint);
        var latest = eventRepository.findLatest(projectId, fingerprint);
        var recent = eventRepository.findRecent(projectId, fingerprint, 1);
        ErrorDetailResponse detail = ErrorDetailResponse.from(group, latest, recent, objectMapper);

        try {
            AiAnalysisResponse result = aiService.analyze(projectId, detail, force);
            return ResponseEntity.ok(ApiResponse.ok(result));
        } catch (Exception e) {
            log.warn("AI analysis failed for {}: {}", fingerprint, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(ApiResponse.error(
                    "AI_REQUEST_FAILED",
                    "AI analysis failed: " + e.getMessage(),
                    null));
        }
    }

    @GetMapping("/{fingerprint}/ai-analysis")
    public ResponseEntity<ApiResponse<AiAnalysisResponse>> cached(
            @PathVariable String fingerprint,
            @RequestParam UUID projectId) {
        return aiService.getCached(projectId, fingerprint)
                .map(r -> ResponseEntity.ok(ApiResponse.ok(r)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("NOT_FOUND", "No cached AI analysis", null)));
    }

    @GetMapping("/ai-analysis/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> status() {
        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "configured", aiService.isConfigured()
        )));
    }
}
