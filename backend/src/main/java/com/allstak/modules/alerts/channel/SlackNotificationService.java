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
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
@NullMarked
public class SlackNotificationService implements NotificationChannel {

    private static final Logger log = LoggerFactory.getLogger(SlackNotificationService.class);
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm 'UTC'")
            .withZone(ZoneOffset.UTC);
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10)).build();

    @Override
    public String getType() { return "slack"; }

    @Override
    public void send(AlertTriggerEvent event, Map<String, Object> channelConfig) {
        String webhookUrl = (String) channelConfig.get("webhook_url");
        if (webhookUrl == null || webhookUrl.isBlank()) {
            log.warn("Slack webhook_url not configured for event: {}", event.triggerType());
            return;
        }

        String emoji = severityEmoji(event.severity());
        Map<String, Object> payload = buildPayload(event, emoji);

        try {
            String json = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(payload);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(webhookUrl))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                log.error("Slack webhook returned {}: {}", response.statusCode(), response.body());
                throw new RuntimeException("Slack webhook failed: HTTP " + response.statusCode());
            }
            log.debug("Slack notification sent for {}", event.triggerType());
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to send Slack notification", e);
        }
    }

    Map<String, Object> buildPayload(AlertTriggerEvent event, String emoji) {
        return Map.of("blocks", List.of(
                Map.of("type", "header", "text",
                        Map.of("type", "plain_text", "text", emoji + " " + event.title())),
                Map.of("type", "section", "fields", List.of(
                        Map.of("type", "mrkdwn", "text", "*Project:*\n" + event.projectName()),
                        Map.of("type", "mrkdwn", "text", "*Trigger:*\n" + event.triggerType()),
                        Map.of("type", "mrkdwn", "text", "*Severity:*\n" + event.severity()),
                        Map.of("type", "mrkdwn", "text", "*Time:*\n" + TIME_FMT.format(event.triggeredAt()))
                )),
                Map.of("type", "section", "text",
                        Map.of("type", "mrkdwn", "text", event.description())),
                Map.of("type", "actions", "elements", List.of(
                        Map.of("type", "button",
                                "text", Map.of("type", "plain_text", "text", "View in AllStak"),
                                "url", event.deepLinkUrl() != null ? event.deepLinkUrl() : "https://allstak.io",
                                "style", "primary")
                ))
        ));
    }

    static String severityEmoji(String severity) {
        return switch (severity) {
            case "critical" -> "\uD83D\uDD34";
            case "warning" -> "\uD83D\uDFE1";
            default -> "\uD83D\uDD35";
        };
    }
}
