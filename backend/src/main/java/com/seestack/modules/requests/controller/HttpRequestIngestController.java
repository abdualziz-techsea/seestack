package com.seestack.modules.requests.controller;

import com.seestack.modules.requests.dto.HttpRequestIngestRequest;
import com.seestack.modules.requests.service.HttpRequestIngestService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.jspecify.annotations.NullMarked;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/ingest/v1/http-requests")
@NullMarked
public class HttpRequestIngestController {

    private final HttpRequestIngestService ingestService;

    public HttpRequestIngestController(HttpRequestIngestService ingestService) {
        this.ingestService = ingestService;
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> ingest(
            @Valid @RequestBody HttpRequestIngestRequest request,
            HttpServletRequest httpRequest) {

        // projectId can come from API key filter or from the request body
        UUID projectId = (UUID) httpRequest.getAttribute("seestack.projectId");
        if (projectId == null) {
            projectId = request.projectId();
        }

        int accepted = ingestService.ingest(projectId, request);

        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(Map.of("ok", true, "accepted", accepted));
    }
}
