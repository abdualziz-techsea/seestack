package com.seestack.modules.ssh.entity;

import jakarta.persistence.*;
import org.jspecify.annotations.NullMarked;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "ssh_servers")
@NullMarked
public class SshServerEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String host;

    @Column(nullable = false)
    private int port = 22;

    @Column(nullable = false)
    private String username;

    @Column(name = "private_key_enc", nullable = false)
    private String privateKeyEnc;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected SshServerEntity() {}

    public SshServerEntity(UUID projectId, String name, String host, int port,
                           String username, String privateKeyEnc) {
        this.projectId = projectId;
        this.name = name;
        this.host = host;
        this.port = port;
        this.username = username;
        this.privateKeyEnc = privateKeyEnc;
    }

    public UUID getId() { return id; }
    public UUID getProjectId() { return projectId; }
    public String getName() { return name; }
    public String getHost() { return host; }
    public int getPort() { return port; }
    public String getUsername() { return username; }
    public String getPrivateKeyEnc() { return privateKeyEnc; }
    public Instant getCreatedAt() { return createdAt; }

    public void update(String name, String host, int port, String username, String privateKeyEnc) {
        this.name = name;
        this.host = host;
        this.port = port;
        this.username = username;
        this.privateKeyEnc = privateKeyEnc;
    }
}
