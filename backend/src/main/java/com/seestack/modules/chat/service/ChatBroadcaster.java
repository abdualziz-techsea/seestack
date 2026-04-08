package com.seestack.modules.chat.service;

import com.seestack.modules.chat.dto.MessageResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.jspecify.annotations.NullMarked;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

/**
 * Manages WebSocket sessions and broadcasts chat messages to connected clients
 * filtered by channel_id.
 */
@Component
@NullMarked
public class ChatBroadcaster {

    private static final Logger log = LoggerFactory.getLogger(ChatBroadcaster.class);

    private final ConcurrentHashMap<UUID, CopyOnWriteArraySet<WebSocketSession>> sessions = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper;

    public ChatBroadcaster(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public void register(UUID channelId, WebSocketSession session) {
        sessions.computeIfAbsent(channelId, k -> new CopyOnWriteArraySet<>()).add(session);
        log.debug("Chat WebSocket session {} registered for channel {}", session.getId(), channelId);
    }

    public void unregister(UUID channelId, WebSocketSession session) {
        var set = sessions.get(channelId);
        if (set != null) {
            set.remove(session);
            if (set.isEmpty()) sessions.remove(channelId);
        }
    }

    public void broadcast(UUID channelId, MessageResponse message) {
        var set = sessions.get(channelId);
        if (set == null || set.isEmpty()) return;

        try {
            String json = objectMapper.writeValueAsString(message);
            TextMessage wsMessage = new TextMessage(json);

            for (WebSocketSession session : set) {
                if (session.isOpen()) {
                    try {
                        session.sendMessage(wsMessage);
                    } catch (IOException e) {
                        log.warn("Failed to send chat message to session {}", session.getId());
                        set.remove(session);
                    }
                } else {
                    set.remove(session);
                }
            }
        } catch (Exception e) {
            log.error("Failed to broadcast chat message to channel {}", channelId, e);
        }
    }
}
