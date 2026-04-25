package com.seestack.modules.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.jspecify.annotations.NullMarked;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Component
@NullMarked
public class OpenAiClient {

    private static final Logger log = LoggerFactory.getLogger(OpenAiClient.class);
    private static final String API_URL = "https://api.openai.com/v1/chat/completions";

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10)).build();
    private final ObjectMapper objectMapper;
    private final String apiKey;
    private final String model;

    public OpenAiClient(ObjectMapper objectMapper,
                        @Value("${OPENAI_API_KEY:}") String apiKey,
                        @Value("${OPENAI_MODEL:gpt-4o-mini}") String model) {
        this.objectMapper = objectMapper;
        this.apiKey = apiKey;
        this.model = model;
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    public String getModel() { return model; }

    /** Sends a JSON-mode chat completion. Returns the raw content string. */
    public String chatJson(String systemPrompt, String userPrompt) throws Exception {
        Map<String, Object> body = Map.of(
                "model", model,
                "response_format", Map.of("type", "json_object"),
                "temperature", 0.2,
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", userPrompt)
                )
        );

        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(API_URL))
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(45))
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                .build();

        HttpResponse<String> resp = http.send(req, HttpResponse.BodyHandlers.ofString());
        if (resp.statusCode() >= 400) {
            log.warn("OpenAI API error {}: {}", resp.statusCode(), resp.body());
            throw new RuntimeException("OpenAI API returned " + resp.statusCode());
        }
        JsonNode root = objectMapper.readTree(resp.body());
        return root.path("choices").path(0).path("message").path("content").asText("{}");
    }
}
