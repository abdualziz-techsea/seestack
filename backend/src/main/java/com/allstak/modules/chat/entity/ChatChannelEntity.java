package com.allstak.modules.chat.entity;

import jakarta.persistence.*;
import org.jspecify.annotations.NullMarked;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "chat_channels")
@NullMarked
public class ChatChannelEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "org_id", nullable = false)
    private UUID orgId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "is_default", nullable = false)
    private boolean isDefault;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected ChatChannelEntity() {}

    public ChatChannelEntity(UUID orgId, String name, boolean isDefault) {
        this.orgId = orgId;
        this.name = name;
        this.isDefault = isDefault;
    }

    public UUID getId() { return id; }
    public UUID getOrgId() { return orgId; }
    public String getName() { return name; }
    public boolean isDefault() { return isDefault; }
    public Instant getCreatedAt() { return createdAt; }

    public void setName(String name) { this.name = name; }
}
