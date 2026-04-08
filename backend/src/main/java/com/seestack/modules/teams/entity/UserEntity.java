package com.seestack.modules.teams.entity;

import jakarta.persistence.*;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "users")
@NullMarked
public class UserEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "keycloak_id", nullable = false, unique = true)
    private String keycloakId;

    @Column(nullable = false, unique = true)
    private String email;

    @Nullable
    @Column(name = "org_id")
    private UUID orgId;

    @Column(name = "org_role", nullable = false, length = 50)
    private String orgRole = "member";

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected UserEntity() {}

    public UserEntity(String keycloakId, String email, @Nullable UUID orgId, String orgRole) {
        this.keycloakId = keycloakId;
        this.email = email;
        this.orgId = orgId;
        this.orgRole = orgRole;
    }

    public UUID getId() { return id; }
    public String getKeycloakId() { return keycloakId; }
    public String getEmail() { return email; }
    public @Nullable UUID getOrgId() { return orgId; }
    public String getOrgRole() { return orgRole; }
    public Instant getCreatedAt() { return createdAt; }

    public void setOrgId(@Nullable UUID orgId) { this.orgId = orgId; }
    public void setOrgRole(String orgRole) { this.orgRole = orgRole; }
}
