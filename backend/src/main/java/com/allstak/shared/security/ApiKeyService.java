package com.allstak.shared.security;

import jakarta.persistence.*;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;

/**
 * Validates ingest API keys (X-AllStak-Key header).
 * Keys are stored as SHA-256 hashes — the raw key is never persisted.
 */
@Service
@NullMarked
public class ApiKeyService {

    private final ApiKeyRepository repository;

    public ApiKeyService(ApiKeyRepository repository) {
        this.repository = repository;
    }

    /**
     * Validates a raw API key and returns the associated project ID if valid.
     *
     * @param rawKey the raw key from the X-AllStak-Key header
     * @return Optional containing the project UUID, or empty if invalid
     */
    public Optional<UUID> validateAndGetProjectId(@Nullable String rawKey) {
        if (rawKey == null || rawKey.isBlank()) {
            return Optional.empty();
        }
        String hash = sha256Hex(rawKey);
        return repository.findProjectIdByKeyHash(hash)
                .map(record -> {
                    repository.updateLastUsed(record.id());
                    return record.projectId();
                });
    }

    /**
     * Hashes a raw API key with SHA-256 for storage or lookup.
     */
    public String hash(@Nullable String rawKey) {
        if (rawKey == null) return "";
        return sha256Hex(rawKey);
    }

    private String sha256Hex(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
