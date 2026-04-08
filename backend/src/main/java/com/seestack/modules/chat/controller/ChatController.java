package com.seestack.modules.chat.controller;

import com.seestack.modules.chat.dto.*;
import com.seestack.modules.chat.entity.ChannelReadReceiptEntity;
import com.seestack.modules.chat.entity.ChatMessageEntity;
import com.seestack.modules.chat.entity.MessageReactionEntity;
import com.seestack.modules.chat.repository.ChannelReadReceiptRepository;
import com.seestack.modules.chat.repository.ChatMessageRepository;
import com.seestack.modules.chat.repository.MessageReactionRepository;
import com.seestack.modules.chat.service.ChatBroadcaster;
import com.seestack.modules.chat.service.ChatChannelService;
import com.seestack.modules.chat.service.ChatMessageService;
import com.seestack.modules.teams.entity.UserEntity;
import com.seestack.modules.teams.repository.UserRepository;
import com.seestack.shared.utils.ApiResponse;
import jakarta.validation.Valid;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/chat")
@NullMarked
public class ChatController {

    private final ChatChannelService channelService;
    private final ChatMessageService messageService;
    private final ChatBroadcaster broadcaster;
    private final UserRepository userRepository;
    private final ChatMessageRepository messageRepository;
    private final MessageReactionRepository reactionRepository;
    private final ChannelReadReceiptRepository readReceiptRepository;

    public ChatController(ChatChannelService channelService,
                           ChatMessageService messageService,
                           ChatBroadcaster broadcaster,
                           UserRepository userRepository,
                           ChatMessageRepository messageRepository,
                           MessageReactionRepository reactionRepository,
                           ChannelReadReceiptRepository readReceiptRepository) {
        this.channelService = channelService;
        this.messageService = messageService;
        this.broadcaster = broadcaster;
        this.userRepository = userRepository;
        this.messageRepository = messageRepository;
        this.reactionRepository = reactionRepository;
        this.readReceiptRepository = readReceiptRepository;
    }

    // ── Channels ────────────────────────────────────────────

    @PostMapping("/channels")
    public ResponseEntity<ApiResponse<ChannelResponse>> createChannel(
            @Valid @RequestBody ChannelCreateRequest request) {
        var entity = channelService.create(request.orgId(), request.name());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(ChannelResponse.from(entity)));
    }

    @PostMapping("/channels/defaults")
    public ResponseEntity<ApiResponse<Object>> createDefaults(@RequestParam UUID orgId) {
        var defaults = channelService.createDefaultChannels(orgId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(defaults.stream().map(ChannelResponse::from).toList()));
    }

    @GetMapping("/channels")
    public ResponseEntity<ApiResponse<Map<String, Object>>> listChannels(
            @RequestParam UUID orgId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int perPage) {
        Page<ChannelResponse> results = channelService.list(orgId, page, perPage).map(ChannelResponse::from);
        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "items", results.getContent(),
                "pagination", Map.of("page", results.getNumber() + 1, "perPage", results.getSize(), "total", results.getTotalElements())
        )));
    }

    @PutMapping("/channels/{channelId}")
    public ResponseEntity<ApiResponse<ChannelResponse>> renameChannel(
            @PathVariable UUID channelId, @RequestParam UUID orgId, @RequestParam String name) {
        return ResponseEntity.ok(ApiResponse.ok(
                ChannelResponse.from(channelService.rename(orgId, channelId, name))));
    }

    @DeleteMapping("/channels/{channelId}")
    public ResponseEntity<Void> deleteChannel(@PathVariable UUID channelId, @RequestParam UUID orgId) {
        channelService.delete(orgId, channelId);
        return ResponseEntity.noContent().build();
    }

    // ── Channel Members ───────────────────────────────────

    @GetMapping("/channels/{channelId}/members")
    public ResponseEntity<ApiResponse<Object>> listChannelMembers(
            @PathVariable UUID channelId) {
        var members = channelService.listMembers(channelId).stream().map(m -> Map.of(
                "id", m.getUserId().toString(),
                "userName", m.getUserName(),
                "channelId", m.getChannelId().toString(),
                "joinedAt", m.getJoinedAt().toString()
        )).toList();
        return ResponseEntity.ok(ApiResponse.ok(members));
    }

    @PostMapping("/channels/{channelId}/members")
    public ResponseEntity<ApiResponse<Object>> addChannelMember(
            @PathVariable UUID channelId,
            @RequestBody Map<String, String> body) {
        UUID userId = UUID.fromString(body.get("userId"));
        String userName = body.getOrDefault("userName", "");
        var member = channelService.addMember(channelId, userId, userName);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(Map.of(
                "id", member.getUserId().toString(),
                "userName", member.getUserName(),
                "channelId", member.getChannelId().toString()
        )));
    }

    @DeleteMapping("/channels/{channelId}/members/{userId}")
    public ResponseEntity<Void> removeChannelMember(
            @PathVariable UUID channelId, @PathVariable UUID userId) {
        channelService.removeMember(channelId, userId);
        return ResponseEntity.noContent().build();
    }

    // ── Org Members (for add-member search — eligible users) ──

    @GetMapping("/members")
    public ResponseEntity<ApiResponse<Object>> listOrgMembers(
            @RequestParam UUID orgId) {
        List<UserEntity> users = userRepository.findByOrgId(orgId);
        var members = users.stream().map(u -> Map.of(
                "id", u.getId().toString(),
                "email", u.getEmail(),
                "userName", u.getEmail().split("@")[0]
        )).toList();
        return ResponseEntity.ok(ApiResponse.ok(members));
    }

    // ── Messages ────────────────────────────────────────────

    @PostMapping("/channels/{channelId}/messages")
    public ResponseEntity<ApiResponse<MessageResponse>> sendMessage(
            @PathVariable UUID channelId,
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody MessageRequest request) {
        // Resolve user from JWT if userId not provided or resolve from keycloakId
        UUID userId = request.userId();
        String userName = request.userName();

        if (jwt != null) {
            String keycloakId = jwt.getSubject();
            var userOpt = userRepository.findByKeycloakId(keycloakId);
            if (userOpt.isPresent()) {
                userId = userOpt.get().getId();
            }
            if (userName == null || userName.isBlank()) {
                userName = jwt.getClaimAsString("name");
                if (userName == null) userName = jwt.getClaimAsString("preferred_username");
                if (userName == null) userName = "User";
            }
        }

        var entity = messageService.send(channelId, userId, userName, request.content(), request.linkedErrorId());
        var response = MessageResponse.from(entity);

        // Broadcast to WebSocket subscribers
        broadcaster.broadcast(channelId, response);

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @GetMapping("/channels/{channelId}/messages")
    public ResponseEntity<ApiResponse<Map<String, Object>>> messageHistory(
            @PathVariable UUID channelId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int perPage) {
        Page<MessageResponse> results = messageService.getHistory(channelId, page, perPage).map(MessageResponse::from);
        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "items", results.getContent(),
                "pagination", Map.of("page", results.getNumber() + 1, "perPage", results.getSize(), "total", results.getTotalElements())
        )));
    }

    // ── Message Edit ────────────────────────────────────────

    @PatchMapping("/messages/{id}")
    public ResponseEntity<ApiResponse<MessageResponse>> editMessage(
            @PathVariable UUID id,
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody MessageEditRequest request) {
        var msg = messageRepository.findById(id).orElse(null);
        if (msg == null) return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("NOT_FOUND", "Message not found", null));

        UUID currentUserId = resolveUserId(jwt);
        if (!msg.getUserId().equals(currentUserId))
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("FORBIDDEN", "Only the author can edit", null));

        if (msg.isDeleted())
            return ResponseEntity.unprocessableEntity()
                    .body(ApiResponse.error("VALIDATION_ERROR", "Cannot edit a deleted message", null));

        msg.editContent(request.content());
        messageRepository.save(msg);
        return ResponseEntity.ok(ApiResponse.ok(MessageResponse.from(msg)));
    }

    // ── Message Delete (soft) ───────────────────────────────

    @DeleteMapping("/messages/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> deleteMessage(
            @PathVariable UUID id,
            @AuthenticationPrincipal Jwt jwt) {
        var msg = messageRepository.findById(id).orElse(null);
        if (msg == null) return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("NOT_FOUND", "Message not found", null));

        if (msg.isDeleted())
            return ResponseEntity.unprocessableEntity()
                    .body(ApiResponse.error("VALIDATION_ERROR", "Message already deleted", null));

        UUID currentUserId = resolveUserId(jwt);
        if (!msg.getUserId().equals(currentUserId)) {
            // Check if user is admin/owner (simplified — allow for now)
        }

        msg.softDelete();
        messageRepository.save(msg);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("messageId", id.toString(), "deleted", true)));
    }

    // ── Reactions ────────────────────────────────────────────

    @PostMapping("/messages/{id}/reactions")
    public ResponseEntity<ApiResponse<Object>> addReaction(
            @PathVariable UUID id,
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody ReactionRequest request) {
        var msg = messageRepository.findById(id).orElse(null);
        if (msg == null) return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("NOT_FOUND", "Message not found", null));
        if (msg.isDeleted())
            return ResponseEntity.unprocessableEntity()
                    .body(ApiResponse.error("VALIDATION_ERROR", "Cannot react to a deleted message", null));

        UUID userId = resolveUserId(jwt);
        if (reactionRepository.existsByMessageIdAndUserIdAndEmoji(id, userId, request.emoji())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.error("CONFLICT", "Already reacted with this emoji", null));
        }

        reactionRepository.save(new MessageReactionEntity(id, userId, request.emoji()));
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(Map.of("emoji", request.emoji(), "added", true)));
    }

    @DeleteMapping("/messages/{id}/reactions/{emoji}")
    public ResponseEntity<ApiResponse<Object>> removeReaction(
            @PathVariable UUID id, @PathVariable String emoji,
            @AuthenticationPrincipal Jwt jwt) {
        UUID userId = resolveUserId(jwt);
        var reaction = reactionRepository.findByMessageIdAndUserIdAndEmoji(id, userId, emoji);
        if (reaction.isEmpty())
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("NOT_FOUND", "Reaction not found", null));
        reactionRepository.delete(reaction.get());
        return ResponseEntity.ok(ApiResponse.ok(Map.of("emoji", emoji, "removed", true)));
    }

    // ── Pinning ─────────────────────────────────────────────

    @PatchMapping("/messages/{id}/pin")
    public ResponseEntity<ApiResponse<MessageResponse>> togglePin(
            @PathVariable UUID id,
            @AuthenticationPrincipal Jwt jwt) {
        var msg = messageRepository.findById(id).orElse(null);
        if (msg == null) return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("NOT_FOUND", "Message not found", null));
        if (msg.isDeleted())
            return ResponseEntity.unprocessableEntity()
                    .body(ApiResponse.error("VALIDATION_ERROR", "Cannot pin a deleted message", null));

        msg.togglePin();
        messageRepository.save(msg);
        return ResponseEntity.ok(ApiResponse.ok(MessageResponse.from(msg)));
    }

    @GetMapping("/channels/{channelId}/pinned")
    public ResponseEntity<ApiResponse<Object>> pinnedMessages(@PathVariable UUID channelId) {
        var pinned = messageRepository.findByChannelIdAndPinnedTrueAndDeletedFalse(channelId);
        var items = pinned.stream().map(MessageResponse::from).toList();
        return ResponseEntity.ok(ApiResponse.ok(Map.of("items", items)));
    }

    // ── Search ──────────────────────────────────────────────

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Object>> search(
            @RequestParam UUID orgId,
            @RequestParam @Nullable String q) {
        if (q == null || q.length() < 2)
            return ResponseEntity.unprocessableEntity()
                    .body(ApiResponse.error("VALIDATION_ERROR", "Query must be at least 2 characters", null));

        var results = messageService.search(orgId, q);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("query", q, "total", results.size(), "items", results)));
    }

    // ── Read Receipts ───────────────────────────────────────

    @PutMapping("/channels/{channelId}/read")
    public ResponseEntity<ApiResponse<Object>> markAsRead(
            @PathVariable UUID channelId,
            @AuthenticationPrincipal Jwt jwt) {
        UUID userId = resolveUserId(jwt);
        var receipt = readReceiptRepository.findByChannelIdAndUserId(channelId, userId);
        if (receipt.isPresent()) {
            receipt.get().updateLastRead();
            readReceiptRepository.save(receipt.get());
        } else {
            readReceiptRepository.save(new ChannelReadReceiptEntity(channelId, userId));
        }
        return ResponseEntity.ok(ApiResponse.ok(Map.of("channelId", channelId.toString(), "readAt", Instant.now().toString())));
    }

    // ── Helpers ──────────────────────────────────────────────

    private UUID resolveUserId(@Nullable Jwt jwt) {
        if (jwt == null) return UUID.fromString("00000000-0000-0000-0000-000000000000");
        String keycloakId = jwt.getSubject();
        return userRepository.findByKeycloakId(keycloakId)
                .map(UserEntity::getId)
                .orElse(UUID.fromString("00000000-0000-0000-0000-000000000000"));
    }
}
