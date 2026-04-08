package com.seestack.modules.errors.entity;

import jakarta.persistence.*;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "error_groups")
@NullMarked
public class ErrorGroupEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(nullable = false, length = 64)
    private String fingerprint;

    @Column(name = "exception_class", nullable = false, length = 255)
    private String exceptionClass;

    @Column(nullable = false, length = 500)
    private String title;

    @Nullable
    @Column(length = 50)
    private String level;

    @Nullable
    @Column(length = 100)
    private String environment;

    @Column(nullable = false, length = 50)
    private String status = "unresolved";

    @Column(name = "occurrences", nullable = false)
    private long occurrences = 1;

    @Column(name = "first_seen", nullable = false)
    private Instant firstSeen;

    @Column(name = "last_seen", nullable = false)
    private Instant lastSeen;

    @Column(name = "trace_id")
    private String traceId = "";

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected ErrorGroupEntity() {}

    public ErrorGroupEntity(UUID projectId, String fingerprint, String exceptionClass,
                            String title, @Nullable String level, @Nullable String environment,
                            Instant timestamp) {
        this.projectId = projectId;
        this.fingerprint = fingerprint;
        this.exceptionClass = exceptionClass;
        this.title = title;
        this.level = level;
        this.environment = environment;
        this.firstSeen = timestamp;
        this.lastSeen = timestamp;
    }

    public UUID getId() { return id; }
    public UUID getProjectId() { return projectId; }
    public String getFingerprint() { return fingerprint; }
    public String getExceptionClass() { return exceptionClass; }
    public String getTitle() { return title; }
    public @Nullable String getLevel() { return level; }
    public @Nullable String getEnvironment() { return environment; }
    public String getStatus() { return status; }
    public long getOccurrences() { return occurrences; }
    public Instant getFirstSeen() { return firstSeen; }
    public Instant getLastSeen() { return lastSeen; }

    public String getTraceId() { return traceId; }

    public void updateStatus(String status) {
        this.status = status;
    }
}
