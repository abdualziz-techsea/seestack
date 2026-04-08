package com.seestack.modules.chat.entity;

import jakarta.persistence.*;
import org.jspecify.annotations.NullMarked;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "message_reactions",
       uniqueConstraints = @UniqueConstraint(columnNames = {"message_id", "user_id", "emoji"}))
@NullMarked
public class MessageReactionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "message_id", nullable = false)
    private UUID messageId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false, length = 10)
    private String emoji;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected MessageReactionEntity() {}

    public MessageReactionEntity(UUID messageId, UUID userId, String emoji) {
        this.messageId = messageId;
        this.userId = userId;
        this.emoji = emoji;
    }

    public UUID getId() { return id; }
    public UUID getMessageId() { return messageId; }
    public UUID getUserId() { return userId; }
    public String getEmoji() { return emoji; }
    public Instant getCreatedAt() { return createdAt; }
}
