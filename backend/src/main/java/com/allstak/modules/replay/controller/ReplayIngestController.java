package com.allstak.modules.replay.controller;

import com.allstak.ingestion.kafka.ReplayKafkaEvent;
import com.allstak.modules.replay.dto.ReplayIngestRequest;
import com.allstak.modules.replay.service.InputMaskingService;
import com.allstak.shared.security.ApiKeyAuthFilter;
import com.allstak.shared.utils.ApiResponse;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.jspecify.annotations.NullMarked;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/ingest/v1/replay")
@NullMarked
public class ReplayIngestController {

    private static final String TOPIC = "allstak.replay";

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;
    private final InputMaskingService maskingService;

    public ReplayIngestController(KafkaTemplate<String, String> kafkaTemplate,
                                   ObjectMapper objectMapper,
                                   InputMaskingService maskingService) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
        this.maskingService = maskingService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> ingest(
            @Valid @RequestBody ReplayIngestRequest request,
            HttpServletRequest httpRequest) throws JsonProcessingException {

        UUID projectId = (UUID) httpRequest.getAttribute(ApiKeyAuthFilter.PROJECT_ID_ATTRIBUTE);

        // Mask sensitive data in all events
        var maskedEvents = request.events().stream()
                .map(e -> new ReplayKafkaEvent.ReplayEventItem(
                        e.eventType(),
                        maskingService.mask(e.eventData()),
                        e.url(),
                        e.timestampMillis()))
                .toList();

        var event = new ReplayKafkaEvent(projectId, request.fingerprint(),
                request.sessionId(), maskedEvents);

        kafkaTemplate.send(TOPIC, request.fingerprint(), objectMapper.writeValueAsString(event));

        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(ApiResponse.ok(Map.of("eventsReceived", maskedEvents.size())));
    }
}
