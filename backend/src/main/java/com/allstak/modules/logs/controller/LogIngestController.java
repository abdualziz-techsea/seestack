package com.allstak.modules.logs.controller;

import com.allstak.ingestion.kafka.LogKafkaEvent;
import com.allstak.modules.logs.dto.LogIngestRequest;
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
@RequestMapping("/ingest/v1/logs")
@NullMarked
public class LogIngestController {

    private static final String TOPIC = "allstak.logs";

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public LogIngestController(KafkaTemplate<String, String> kafkaTemplate,
                               ObjectMapper objectMapper) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, String>>> ingest(
            @Valid @RequestBody LogIngestRequest request,
            HttpServletRequest httpRequest) throws JsonProcessingException {

        UUID projectId = (UUID) httpRequest.getAttribute(ApiKeyAuthFilter.PROJECT_ID_ATTRIBUTE);
        UUID eventId = UUID.randomUUID();

        LogKafkaEvent event = new LogKafkaEvent(
                eventId,
                projectId,
                request.level(),
                request.message(),
                request.service(),
                request.traceId(),
                request.metadata(),
                System.currentTimeMillis()
        );

        String key = projectId.toString();
        kafkaTemplate.send(TOPIC, key, objectMapper.writeValueAsString(event));

        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(ApiResponse.ok(Map.of("id", eventId.toString())));
    }
}
