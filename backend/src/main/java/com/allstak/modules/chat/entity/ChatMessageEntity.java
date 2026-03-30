package com.allstak.modules.chat.entity;

import jakarta.persistence.*;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "chat_messages")
@NullMarked
public class ChatMessageEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "channel_id", nullable = false)
    private UUID channelId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "user_name", nullable = false)
    private String userName = "";

    @Nullable
    @Column(name = "linked_error_id")
    private UUID linkedErrorId;

    @Column(name = "is_edited", nullable = false)
    private boolean edited = false;

    @Column(name = "is_deleted", nullable = false)
    private boolean deleted = false;

    @Column(name = "is_pinned", nullable = false)
    private boolean pinned = false;

    @Nullable
    @Column(name = "edited_at")
    private Instant editedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected ChatMessageEntity() {}

    public ChatMessageEntity(UUID channelId, UUID userId, String userName, String content, @Nullable UUID linkedErrorId) {
        this.channelId = channelId;
        this.userId = userId;
        this.userName = userName;
        this.content = content;
        this.linkedErrorId = linkedErrorId;
    }

    public UUID getId() { return id; }
    public UUID getChannelId() { return channelId; }
    public UUID getUserId() { return userId; }
    public String getUserName() { return userName; }
    public String getContent() { return content; }
    public @Nullable UUID getLinkedErrorId() { return linkedErrorId; }
    public Instant getCreatedAt() { return createdAt; }
    public boolean isEdited() { return edited; }
    public boolean isDeleted() { return deleted; }
    public boolean isPinned() { return pinned; }
    public @Nullable Instant getEditedAt() { return editedAt; }

    public void editContent(String newContent) {
        this.content = newContent;
        this.edited = true;
        this.editedAt = Instant.now();
    }

    public void softDelete() {
        this.deleted = true;
        this.content = "[deleted]";
    }

    public void togglePin() {
        this.pinned = !this.pinned;
    }
}
