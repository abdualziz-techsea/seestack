package com.seestack.modules.ai.entity;

import jakarta.persistence.*;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "ai_error_analyses")
@NullMarked
public class AiErrorAnalysisEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(nullable = false, length = 64)
    private String fingerprint;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String payload;

    @Nullable
    @Column(length = 100)
    private String model;

    @Nullable
    @Column(name = "occurrences_at_generation")
    private Long occurrencesAtGeneration;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected AiErrorAnalysisEntity() {}

    public AiErrorAnalysisEntity(UUID projectId, String fingerprint, String payload,
                                 @Nullable String model, @Nullable Long occurrencesAtGeneration) {
        this.projectId = projectId;
        this.fingerprint = fingerprint;
        this.payload = payload;
        this.model = model;
        this.occurrencesAtGeneration = occurrencesAtGeneration;
    }

    public UUID getId() { return id; }
    public UUID getProjectId() { return projectId; }
    public String getFingerprint() { return fingerprint; }
    public String getPayload() { return payload; }
    public @Nullable String getModel() { return model; }
    public @Nullable Long getOccurrencesAtGeneration() { return occurrencesAtGeneration; }
    public Instant getCreatedAt() { return createdAt; }

    public void update(String payload, @Nullable String model, @Nullable Long occurrencesAtGeneration) {
        this.payload = payload;
        this.model = model;
        this.occurrencesAtGeneration = occurrencesAtGeneration;
        this.createdAt = Instant.now();
    }
}
