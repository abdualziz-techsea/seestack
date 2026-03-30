package com.allstak.modules.errors.controller;

import com.allstak.ingestion.kafka.ErrorKafkaEvent;
import com.allstak.modules.errors.dto.ErrorIngestRequest;
import com.allstak.shared.security.ApiKeyAuthFilter;
import com.allstak.shared.utils.ApiResponse;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;
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
@RequestMapping("/ingest/v1/errors")
@NullMarked
public class ErrorIngestController {

    private static final String TOPIC = "allstak.errors";

    private final com.allstak.modules.errors.service.ErrorFingerprintService fingerprintService;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public ErrorIngestController(
            com.allstak.modules.errors.service.ErrorFingerprintService fingerprintService,
            KafkaTemplate<String, String> kafkaTemplate,
            ObjectMapper objectMapper) {
        this.fingerprintService = fingerprintService;
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, String>>> ingest(
            @Valid @RequestBody ErrorIngestRequest request,
            HttpServletRequest httpRequest) throws JsonProcessingException {

        UUID projectId = (UUID) httpRequest.getAttribute(ApiKeyAuthFilter.PROJECT_ID_ATTRIBUTE);
        String fingerprint = fingerprintService.generate(request.exceptionClass(), request.stackTrace());
        UUID eventId = UUID.randomUUID();

        var user = request.user();
        ErrorKafkaEvent event = new ErrorKafkaEvent(
                eventId,
                projectId,
                fingerprint,
                request.exceptionClass(),
                request.message(),
                request.stackTrace(),
                request.level(),
                request.environment(),
                request.release(),
                user != null ? user.id() : null,
                user != null ? user.email() : null,
                user != null ? user.ip() : null,
                request.metadata(),
                System.currentTimeMillis()
        );

        kafkaTemplate.send(TOPIC, fingerprint, objectMapper.writeValueAsString(event));

        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(ApiResponse.ok(Map.of("id", eventId.toString())));
    }
}
