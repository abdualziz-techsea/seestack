package com.allstak.modules.chat.entity;

import jakarta.persistence.*;
import org.jspecify.annotations.NullMarked;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "channel_read_receipts",
       uniqueConstraints = @UniqueConstraint(columnNames = {"channel_id", "user_id"}))
@NullMarked
public class ChannelReadReceiptEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "channel_id", nullable = false)
    private UUID channelId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "last_read_at", nullable = false)
    private Instant lastReadAt = Instant.now();

    protected ChannelReadReceiptEntity() {}

    public ChannelReadReceiptEntity(UUID channelId, UUID userId) {
        this.channelId = channelId;
        this.userId = userId;
    }

    public UUID getId() { return id; }
    public UUID getChannelId() { return channelId; }
    public UUID getUserId() { return userId; }
    public Instant getLastReadAt() { return lastReadAt; }

    public void updateLastRead() {
        this.lastReadAt = Instant.now();
    }
}
