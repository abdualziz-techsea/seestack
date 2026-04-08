package com.seestack.modules.chat.controller;

import com.seestack.modules.chat.service.ChatBroadcaster;
import org.jspecify.annotations.NullMarked;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.UUID;

/**
 * WebSocket handler for real-time chat at /api/v1/chat/ws?channelId=<uuid>
 */
@Component
@NullMarked
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private static final Logger log = LoggerFactory.getLogger(ChatWebSocketHandler.class);
    private static final String CHANNEL_ID_ATTR = "channelId";

    private final ChatBroadcaster broadcaster;

    public ChatWebSocketHandler(ChatBroadcaster broadcaster) {
        this.broadcaster = broadcaster;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        UUID channelId = extractParam(session, "channelId");
        if (channelId == null) {
            try { session.close(CloseStatus.BAD_DATA); } catch (Exception ignored) {}
            return;
        }
        session.getAttributes().put(CHANNEL_ID_ATTR, channelId);
        broadcaster.register(channelId, session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        Object attr = session.getAttributes().get(CHANNEL_ID_ATTR);
        if (attr instanceof UUID channelId) {
            broadcaster.unregister(channelId, session);
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        // Messages are sent via REST POST, not WebSocket input
    }

    private UUID extractParam(WebSocketSession session, String param) {
        URI uri = session.getUri();
        if (uri == null) return null;
        try {
            String value = UriComponentsBuilder.fromUri(uri).build()
                    .getQueryParams().getFirst(param);
            return value != null ? UUID.fromString(value) : null;
        } catch (Exception e) {
            return null;
        }
    }
}
