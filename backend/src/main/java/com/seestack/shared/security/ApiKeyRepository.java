package com.seestack.shared.security;

import org.jspecify.annotations.NullMarked;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
@NullMarked
public class ApiKeyRepository {

    private final JdbcClient jdbc;

    public ApiKeyRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<ApiKeyRecord> findProjectIdByKeyHash(String keyHash) {
        return jdbc.sql("""
                SELECT id, project_id FROM api_keys
                WHERE key_hash = :keyHash
                """)
                .param("keyHash", keyHash)
                .query((rs, rowNum) -> new ApiKeyRecord(
                        UUID.fromString(rs.getString("id")),
                        UUID.fromString(rs.getString("project_id"))))
                .optional();
    }

    public void updateLastUsed(UUID id) {
        jdbc.sql("""
                UPDATE api_keys SET last_used_at = NOW() WHERE id = :id
                """)
                .param("id", id)
                .update();
    }

    public record ApiKeyRecord(UUID id, UUID projectId) {}
}
