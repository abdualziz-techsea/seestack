package com.seestack.modules.logs.controller;

import com.seestack.modules.logs.service.LogTailBroadcaster;
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
 * WebSocket handler for live log tailing at /api/v1/logs/tail?projectId=<uuid>
 */
@Component
@NullMarked
public class LogTailWebSocketHandler extends TextWebSocketHandler {

    private static final Logger log = LoggerFactory.getLogger(LogTailWebSocketHandler.class);
    private static final String PROJECT_ID_ATTR = "projectId";

    private final LogTailBroadcaster broadcaster;

    public LogTailWebSocketHandler(LogTailBroadcaster broadcaster) {
        this.broadcaster = broadcaster;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        UUID projectId = extractProjectId(session);
        if (projectId == null) {
            log.warn("WebSocket connection without projectId, closing");
            try { session.close(CloseStatus.BAD_DATA); } catch (Exception ignored) {}
            return;
        }
        session.getAttributes().put(PROJECT_ID_ATTR, projectId);
        broadcaster.register(projectId, session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        Object attr = session.getAttributes().get(PROJECT_ID_ATTR);
        if (attr instanceof UUID projectId) {
            broadcaster.unregister(projectId, session);
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        // Client messages are ignored — this is a one-way stream
    }

    private UUID extractProjectId(WebSocketSession session) {
        URI uri = session.getUri();
        if (uri == null) return null;
        try {
            String param = UriComponentsBuilder.fromUri(uri).build()
                    .getQueryParams().getFirst("projectId");
            return param != null ? UUID.fromString(param) : null;
        } catch (Exception e) {
            return null;
        }
    }
}
