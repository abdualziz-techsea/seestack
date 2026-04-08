package com.seestack.modules.logs.service;

import com.seestack.ingestion.kafka.LogKafkaEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.jspecify.annotations.NullMarked;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

/**
 * Manages WebSocket sessions and broadcasts log events to connected clients
 * filtered by project_id.
 */
@Component
@NullMarked
public class LogTailBroadcaster {

    private static final Logger log = LoggerFactory.getLogger(LogTailBroadcaster.class);

    private final ConcurrentHashMap<UUID, CopyOnWriteArraySet<WebSocketSession>> sessions = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper;

    public LogTailBroadcaster(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public void register(UUID projectId, WebSocketSession session) {
        sessions.computeIfAbsent(projectId, k -> new CopyOnWriteArraySet<>()).add(session);
        log.debug("WebSocket session {} registered for project {}", session.getId(), projectId);
    }

    public void unregister(UUID projectId, WebSocketSession session) {
        var set = sessions.get(projectId);
        if (set != null) {
            set.remove(session);
            if (set.isEmpty()) {
                sessions.remove(projectId);
            }
        }
        log.debug("WebSocket session {} unregistered from project {}", session.getId(), projectId);
    }

    public void broadcast(LogKafkaEvent event) {
        var set = sessions.get(event.projectId());
        if (set == null || set.isEmpty()) return;

        try {
            Map<String, Object> payload = Map.of(
                    "id", event.eventId().toString(),
                    "level", event.level(),
                    "message", event.message(),
                    "service", event.service() != null ? event.service() : "",
                    "timestamp", Instant.ofEpochMilli(event.timestampMillis()).toString()
            );
            String json = objectMapper.writeValueAsString(payload);
            TextMessage message = new TextMessage(json);

            for (WebSocketSession session : set) {
                if (session.isOpen()) {
                    try {
                        session.sendMessage(message);
                    } catch (IOException e) {
                        log.warn("Failed to send to WebSocket session {}", session.getId());
                        set.remove(session);
                    }
                } else {
                    set.remove(session);
                }
            }
        } catch (Exception e) {
            log.error("Failed to broadcast log event {}", event.eventId(), e);
        }
    }
}
