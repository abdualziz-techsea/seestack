package com.seestack.modules.ssh.repository;

import com.seestack.modules.ssh.dto.SshAuditResponse;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Repository;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Repository
@NullMarked
public class SshAuditClickHouseRepository {

    private static final Logger log = LoggerFactory.getLogger(SshAuditClickHouseRepository.class);

    private static final DateTimeFormatter CH_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS").withZone(ZoneOffset.UTC);

    private final DataSource clickHouseDataSource;

    public SshAuditClickHouseRepository(@Qualifier("clickHouseDataSource") DataSource clickHouseDataSource) {
        this.clickHouseDataSource = clickHouseDataSource;
    }

    public AuditLogResult getAuditLog(UUID serverId, @Nullable String timeRange, int page, int perPage) {
        Instant since = resolveTimeRange(timeRange);
        String sinceStr = CH_FORMATTER.format(since);
        int offset = Math.max(0, page - 1) * perPage;

        String countSql = """
                SELECT count() FROM seestack.ssh_audit_logs
                WHERE server_id = ? AND timestamp >= toDateTime64(?, 3)
                """;

        String querySql = """
                SELECT id, server_id, project_id, user_id, command, output, timestamp
                FROM seestack.ssh_audit_logs
                WHERE server_id = ? AND timestamp >= toDateTime64(?, 3)
                ORDER BY timestamp DESC
                LIMIT ? OFFSET ?
                """;

        try (Connection conn = clickHouseDataSource.getConnection()) {
            long total;
            try (PreparedStatement ps = conn.prepareStatement(countSql)) {
                ps.setString(1, serverId.toString());
                ps.setString(2, sinceStr);
                try (ResultSet rs = ps.executeQuery()) {
                    rs.next();
                    total = rs.getLong(1);
                }
            }

            List<SshAuditResponse> items = new ArrayList<>();
            try (PreparedStatement ps = conn.prepareStatement(querySql)) {
                ps.setString(1, serverId.toString());
                ps.setString(2, sinceStr);
                ps.setInt(3, perPage);
                ps.setInt(4, offset);
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        items.add(new SshAuditResponse(
                                UUID.fromString(rs.getString("id")),
                                UUID.fromString(rs.getString("server_id")),
                                UUID.fromString(rs.getString("project_id")),
                                UUID.fromString(rs.getString("user_id")),
                                emptyToNull(rs.getString("command")),
                                emptyToNull(rs.getString("output")),
                                rs.getTimestamp("timestamp").toInstant()
                        ));
                    }
                }
            }

            return new AuditLogResult(items, total);
        } catch (Exception e) {
            log.error("Failed to query SSH audit logs from ClickHouse", e);
            throw new RuntimeException("ClickHouse query failed", e);
        }
    }

    private Instant resolveTimeRange(@Nullable String timeRange) {
        Instant now = Instant.now();
        if (timeRange == null) return now.minus(Duration.ofHours(24));
        return switch (timeRange) {
            case "1h" -> now.minus(Duration.ofHours(1));
            case "24h" -> now.minus(Duration.ofHours(24));
            case "7d" -> now.minus(Duration.ofDays(7));
            case "30d" -> now.minus(Duration.ofDays(30));
            default -> now.minus(Duration.ofHours(24));
        };
    }

    private @Nullable String emptyToNull(@Nullable String value) {
        return (value == null || value.isEmpty()) ? null : value;
    }

    public record AuditLogResult(List<SshAuditResponse> items, long total) {}
}
