package com.seestack.modules.chat.entity;

import jakarta.persistence.*;
import org.jspecify.annotations.NullMarked;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "chat_channel_members", uniqueConstraints = @UniqueConstraint(columnNames = {"channel_id", "user_id"}))
@NullMarked
public class ChatChannelMemberEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "channel_id", nullable = false)
    private UUID channelId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "user_name", nullable = false)
    private String userName = "";

    @Column(name = "joined_at", nullable = false, updatable = false)
    private Instant joinedAt = Instant.now();

    protected ChatChannelMemberEntity() {}

    public ChatChannelMemberEntity(UUID channelId, UUID userId, String userName) {
        this.channelId = channelId;
        this.userId = userId;
        this.userName = userName;
    }

    public UUID getId() { return id; }
    public UUID getChannelId() { return channelId; }
    public UUID getUserId() { return userId; }
    public String getUserName() { return userName; }
    public Instant getJoinedAt() { return joinedAt; }
}
