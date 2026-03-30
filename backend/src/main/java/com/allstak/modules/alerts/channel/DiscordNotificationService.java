package com.allstak.modules.alerts.channel;

import com.allstak.modules.alerts.dto.AlertTriggerEvent;
import org.jspecify.annotations.NullMarked;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
@NullMarked
public class DiscordNotificationService implements NotificationChannel {

    private static final Logger log = LoggerFactory.getLogger(DiscordNotificationService.class);

    static final int CRITICAL_COLOR = 15158332;
    static final int WARNING_COLOR = 16776960;
    static final int INFO_COLOR = 5145560;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10)).build();

    @Override
    public String getType() { return "discord"; }

    @Override
    public void send(AlertTriggerEvent event, Map<String, Object> channelConfig) {
        String webhookUrl = (String) channelConfig.get("webhook_url");
        if (webhookUrl == null || webhookUrl.isBlank()) {
            log.warn("Discord webhook_url not configured for event: {}", event.triggerType());
            return;
        }

        Map<String, Object> payload = buildPayload(event);

        try {
            String json = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(payload);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(webhookUrl))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200 && response.statusCode() != 204) {
                log.error("Discord webhook returned {}: {}", response.statusCode(), response.body());
                throw new RuntimeException("Discord webhook failed: HTTP " + response.statusCode());
            }
            log.debug("Discord notification sent for {}", event.triggerType());
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to send Discord notification", e);
        }
    }

    Map<String, Object> buildPayload(AlertTriggerEvent event) {
        int color = switch (event.severity()) {
            case "critical" -> CRITICAL_COLOR;
            case "warning" -> WARNING_COLOR;
            default -> INFO_COLOR;
        };

        Map<String, Object> embed = Map.of(
                "title", event.title(),
                "description", event.description(),
                "color", color,
                "fields", List.of(
                        Map.of("name", "Project", "value", event.projectName(), "inline", true),
                        Map.of("name", "Severity", "value", event.severity(), "inline", true),
                        Map.of("name", "Trigger", "value", event.triggerType(), "inline", false)
                ),
                "timestamp", event.triggeredAt().toString(),
                "footer", Map.of("text", "AllStak")
        );

        return Map.of("embeds", List.of(embed));
    }
}
