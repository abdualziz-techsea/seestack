package com.allstak.modules.ssh.controller;

import com.allstak.ingestion.kafka.SshAuditKafkaEvent;
import com.allstak.modules.alerts.service.AlertEvaluationService;
import com.allstak.modules.ssh.entity.SshServerEntity;
import com.allstak.modules.ssh.service.SshServerService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.sshd.client.SshClient;
import org.apache.sshd.client.channel.ClientChannel;
import org.apache.sshd.client.channel.ClientChannelEvent;
import org.apache.sshd.client.session.ClientSession;
import org.apache.sshd.common.keyprovider.KeyIdentityProvider;
import org.jspecify.annotations.NullMarked;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.springframework.web.util.UriComponentsBuilder;

import org.apache.sshd.common.config.keys.loader.pem.PEMResourceParserUtils;

import java.io.IOException;
import java.io.OutputStream;
import java.io.PipedInputStream;
import java.io.PipedOutputStream;
import java.io.StringReader;
import java.io.BufferedReader;
import java.net.URI;
import java.security.KeyPair;
import java.security.KeyFactory;
import java.security.spec.PKCS8EncodedKeySpec;
import java.util.Base64;
import java.util.Collection;
import java.util.EnumSet;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * WebSocket handler for SSH terminal sessions at /api/v1/ssh/terminal.
 * Connects to remote SSH server and pipes I/O through WebSocket.
 */
@Component
@NullMarked
public class SshTerminalWebSocketHandler extends TextWebSocketHandler {

    private static final Logger log = LoggerFactory.getLogger(SshTerminalWebSocketHandler.class);
    private static final String TOPIC = "allstak.ssh-audit";

    private final SshServerService sshServerService;
    private final AlertEvaluationService alertEvaluation;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;
    private final ConcurrentHashMap<String, SshSessionState> sessions = new ConcurrentHashMap<>();

    public SshTerminalWebSocketHandler(SshServerService sshServerService,
                                        AlertEvaluationService alertEvaluation,
                                        KafkaTemplate<String, String> kafkaTemplate,
                                        ObjectMapper objectMapper) {
        this.sshServerService = sshServerService;
        this.alertEvaluation = alertEvaluation;
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        URI uri = session.getUri();
        if (uri == null) {
            closeQuietly(session, CloseStatus.BAD_DATA);
            return;
        }

        var params = UriComponentsBuilder.fromUri(uri).build().getQueryParams();
        String serverIdStr = params.getFirst("serverId");
        String projectIdStr = params.getFirst("projectId");

        if (serverIdStr == null || projectIdStr == null) {
            sendError(session, "Missing serverId or projectId");
            closeQuietly(session, CloseStatus.BAD_DATA);
            return;
        }

        UUID serverId;
        UUID projectId;
        try {
            serverId = UUID.fromString(serverIdStr);
            projectId = UUID.fromString(projectIdStr);
        } catch (IllegalArgumentException e) {
            sendError(session, "Invalid serverId or projectId");
            closeQuietly(session, CloseStatus.BAD_DATA);
            return;
        }

        try {
            SshServerEntity server = sshServerService.getById(projectId, serverId);
            String privateKey = sshServerService.getDecryptedPrivateKey(server);

            // Log session start and trigger alert
            publishAudit(serverId, projectId, "[session-start]", null);
            alertEvaluation.onSshSessionStarted(projectId, serverId, server.getName(), server.getUsername());

            // Start SSH connection in background
            new Thread(() -> connectSsh(session, server, privateKey, serverId, projectId),
                    "ssh-terminal-" + session.getId()).start();

        } catch (Exception e) {
            log.error("Failed to establish SSH session", e);
            sendError(session, "Failed to connect: " + e.getMessage());
            closeQuietly(session, CloseStatus.SERVER_ERROR);
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        SshSessionState state = sessions.get(session.getId());
        if (state != null && state.stdin != null) {
            try {
                state.stdin.write(message.getPayload().getBytes());
                state.stdin.flush();
            } catch (IOException e) {
                log.debug("Failed to write to SSH stdin", e);
            }
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        SshSessionState state = sessions.remove(session.getId());
        if (state != null) {
            publishAudit(state.serverId, state.projectId, "[session-end]", null);
            state.close();
        }
    }

    private void connectSsh(WebSocketSession wsSession, SshServerEntity server,
                            String privateKey, UUID serverId, UUID projectId) {
        SshClient client = SshClient.setUpDefaultClient();
        client.start();

        try {
            ClientSession sshSession = client.connect(
                    server.getUsername(), server.getHost(), server.getPort()
            ).verify(30_000).getSession();

            // Add key authentication
            sshSession.addPublicKeyIdentity(loadKeyPair(privateKey));
            sshSession.auth().verify(30_000);

            // Open shell channel
            ClientChannel channel = sshSession.createShellChannel();

            PipedOutputStream pipedOut = new PipedOutputStream();
            PipedInputStream pipedIn = new PipedInputStream(pipedOut);
            channel.setIn(pipedIn);

            // Pipe SSH output to WebSocket
            channel.setOut(new WebSocketOutputStream(wsSession, serverId, projectId));
            channel.setErr(new WebSocketOutputStream(wsSession, serverId, projectId));

            channel.open().verify(10_000);

            sessions.put(wsSession.getId(), new SshSessionState(
                    client, sshSession, channel, pipedOut, serverId, projectId));

            // Wait for channel to close
            channel.waitFor(EnumSet.of(ClientChannelEvent.CLOSED), 0);

        } catch (Exception e) {
            log.error("SSH connection failed for {}", server.getHost(), e);
            sendError(wsSession, "SSH connection failed: " + e.getMessage());
        } finally {
            closeQuietly(wsSession, CloseStatus.NORMAL);
            client.stop();
        }
    }

    private KeyPair loadKeyPair(String pemKey) throws Exception {
        // Use Apache SSHD's built-in key utilities — handles all PEM formats:
        // PKCS1 (BEGIN RSA PRIVATE KEY), PKCS8 (BEGIN PRIVATE KEY), OpenSSH (BEGIN OPENSSH PRIVATE KEY)
        try {
            Iterable<KeyPair> keyPairs = org.apache.sshd.common.util.security.SecurityUtils
                    .loadKeyPairIdentities(null, null,
                            new java.io.ByteArrayInputStream(pemKey.getBytes(java.nio.charset.StandardCharsets.UTF_8)),
                            null);
            for (KeyPair kp : keyPairs) {
                return kp;
            }
        } catch (Exception e) {
            log.debug("Apache SSHD SecurityUtils key loader failed: {}", e.getMessage());
        }

        // Fallback: manual PKCS8 parsing for BEGIN PRIVATE KEY format only
        String base64 = pemKey
                .replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replaceAll("\\s", "");

        byte[] keyBytes = Base64.getDecoder().decode(base64);
        PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(keyBytes);
        KeyFactory kf = KeyFactory.getInstance("RSA");
        var privateKey = kf.generatePrivate(spec);
        return new KeyPair(null, privateKey);
    }

    private void publishAudit(UUID serverId, UUID projectId, String command, String output) {
        try {
            // Use a placeholder userId since WebSocket doesn't carry JWT easily
            UUID userId = UUID.fromString("00000000-0000-0000-0000-000000000000");
            var event = new SshAuditKafkaEvent(serverId, projectId, userId, command, output,
                    System.currentTimeMillis());
            kafkaTemplate.send(TOPIC, serverId.toString(), objectMapper.writeValueAsString(event));
        } catch (Exception e) {
            log.warn("Failed to publish SSH audit event", e);
        }
    }

    private void sendError(WebSocketSession session, String message) {
        try {
            if (session.isOpen()) {
                session.sendMessage(new TextMessage("{\"error\":\"" + message + "\"}"));
            }
        } catch (IOException ignored) {}
    }

    private void closeQuietly(WebSocketSession session, CloseStatus status) {
        try { if (session.isOpen()) session.close(status); } catch (IOException ignored) {}
    }

    /**
     * OutputStream that forwards data to a WebSocket session and logs to audit.
     */
    private class WebSocketOutputStream extends OutputStream {
        private final WebSocketSession session;
        private final UUID serverId;
        private final UUID projectId;

        WebSocketOutputStream(WebSocketSession session, UUID serverId, UUID projectId) {
            this.session = session;
            this.serverId = serverId;
            this.projectId = projectId;
        }

        @Override
        public void write(int b) throws IOException {
            write(new byte[]{(byte) b}, 0, 1);
        }

        @Override
        public void write(byte[] b, int off, int len) throws IOException {
            if (session.isOpen()) {
                String text = new String(b, off, len);
                session.sendMessage(new TextMessage(text));
            }
        }
    }

    private static class SshSessionState {
        final SshClient client;
        final ClientSession sshSession;
        final ClientChannel channel;
        final OutputStream stdin;
        final UUID serverId;
        final UUID projectId;

        SshSessionState(SshClient client, ClientSession sshSession, ClientChannel channel,
                        OutputStream stdin, UUID serverId, UUID projectId) {
            this.client = client;
            this.sshSession = sshSession;
            this.channel = channel;
            this.stdin = stdin;
            this.serverId = serverId;
            this.projectId = projectId;
        }

        void close() {
            try { channel.close(); } catch (Exception ignored) {}
            try { sshSession.close(); } catch (Exception ignored) {}
            try { client.stop(); } catch (Exception ignored) {}
        }
    }
}
