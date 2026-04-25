package com.seestack.modules.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.seestack.modules.ai.dto.AiAnalysisResponse;
import com.seestack.modules.ai.entity.AiErrorAnalysisEntity;
import com.seestack.modules.ai.repository.AiErrorAnalysisRepository;
import com.seestack.modules.errors.dto.ErrorDetailResponse;
import org.jspecify.annotations.NullMarked;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@NullMarked
public class ErrorAiAnalysisService {

    private static final String SYSTEM_PROMPT = """
            You are a senior software engineer triaging a production error in a monitoring system.
            You receive a structured JSON payload describing the error.

            Reply with ONLY a JSON object with these exact fields and no extra keys:
              "explanation"  — 1–2 sentences in plain English describing what happened.
              "rootCause"    — your single best hypothesis for the underlying cause.
              "fixSteps"     — an ordered array of 3–6 short, concrete remediation steps.
              "prevention"   — an array of 2–4 short bullet points to prevent recurrence.
              "severity"     — one of "low", "medium", "high".
              "confidence"   — your confidence in this analysis: "low", "medium", or "high".

            Be specific to the stack trace and message provided. Never recommend ignoring the error.
            Never include markdown, code fences, or text outside the JSON object.
            """;

    private final OpenAiClient openAi;
    private final ErrorDataSanitizer sanitizer;
    private final ObjectMapper objectMapper;
    private final AiErrorAnalysisRepository repository;

    public ErrorAiAnalysisService(OpenAiClient openAi, ErrorDataSanitizer sanitizer,
                                  ObjectMapper objectMapper, AiErrorAnalysisRepository repository) {
        this.openAi = openAi;
        this.sanitizer = sanitizer;
        this.objectMapper = objectMapper;
        this.repository = repository;
    }

    public boolean isConfigured() { return openAi.isConfigured(); }

    @Transactional(readOnly = true)
    public java.util.Optional<AiAnalysisResponse> getCached(UUID projectId, String fingerprint) {
        return repository.findByProjectIdAndFingerprint(projectId, fingerprint)
                .map(this::deserialize);
    }

    @Transactional
    public AiAnalysisResponse analyze(UUID projectId, ErrorDetailResponse err, boolean force) throws Exception {
        if (!force) {
            var cached = repository.findByProjectIdAndFingerprint(projectId, err.fingerprint());
            if (cached.isPresent()) return deserialize(cached.get());
        }

        Map<String, Object> payload = buildPayload(err);
        String userPrompt = objectMapper.writeValueAsString(payload);
        String content = openAi.chatJson(SYSTEM_PROMPT, userPrompt);
        JsonNode json = objectMapper.readTree(content);

        AiAnalysisResponse response = parse(json, openAi.getModel(), false, java.time.Instant.now());

        // Persist with the structured response
        String stored = objectMapper.writeValueAsString(response);
        var existing = repository.findByProjectIdAndFingerprint(projectId, err.fingerprint());
        if (existing.isPresent()) {
            existing.get().update(stored, openAi.getModel(), err.occurrences());
        } else {
            repository.save(new AiErrorAnalysisEntity(
                    projectId, err.fingerprint(), stored, openAi.getModel(), err.occurrences()));
        }
        return response;
    }

    private AiAnalysisResponse deserialize(AiErrorAnalysisEntity e) {
        try {
            AiAnalysisResponse cached = objectMapper.readValue(e.getPayload(), AiAnalysisResponse.class);
            return new AiAnalysisResponse(
                    cached.explanation(), cached.rootCause(), cached.fixSteps(), cached.prevention(),
                    cached.severity(), cached.confidence(),
                    cached.model() == null ? "" : cached.model(),
                    true, true, e.getCreatedAt());
        } catch (Exception ex) {
            return new AiAnalysisResponse("", "", List.of(), List.of(), "low", "low",
                    e.getModel() == null ? "" : e.getModel(), true, true, e.getCreatedAt());
        }
    }

    private AiAnalysisResponse parse(JsonNode json, String model, boolean cached, java.time.Instant at) {
        List<String> fixSteps = new ArrayList<>();
        if (json.path("fixSteps").isArray())
            json.path("fixSteps").forEach(n -> fixSteps.add(n.asText("")));
        List<String> prevention = new ArrayList<>();
        if (json.path("prevention").isArray())
            json.path("prevention").forEach(n -> prevention.add(n.asText("")));

        String severity = normalizeLevel(json.path("severity").asText(""), "medium");
        String confidence = normalizeLevel(json.path("confidence").asText(""), "medium");

        return new AiAnalysisResponse(
                json.path("explanation").asText(""),
                json.path("rootCause").asText(""),
                fixSteps,
                prevention,
                severity,
                confidence,
                model,
                true,
                cached,
                at
        );
    }

    private static String normalizeLevel(String s, String fallback) {
        String v = s == null ? "" : s.trim().toLowerCase();
        return switch (v) {
            case "low", "medium", "high" -> v;
            default -> fallback;
        };
    }

    private Map<String, Object> buildPayload(ErrorDetailResponse err) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("exceptionClass", err.exceptionClass());
        payload.put("message", sanitizer.scrubString(
                err.message() != null ? err.message() : err.title()));
        payload.put("level", err.level());
        payload.put("environment", err.environment());
        payload.put("release", err.release());
        payload.put("occurrences", err.occurrences());
        payload.put("firstSeen", err.firstSeen() == null ? null : err.firstSeen().toString());
        payload.put("lastSeen",  err.lastSeen()  == null ? null : err.lastSeen().toString());

        // Top stack frames only — keep payload small and focused.
        List<String> trace = err.stackTrace().stream()
                .limit(10)
                .map(sanitizer::scrubString)
                .toList();
        payload.put("topStackFrames", trace);

        if (err.metadata() != null) {
            payload.put("metadata", sanitizer.scrubMetadata(err.metadata()));
        }
        return payload;
    }
}
