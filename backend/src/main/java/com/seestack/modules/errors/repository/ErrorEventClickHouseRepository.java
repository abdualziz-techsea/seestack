package com.seestack.modules.errors.repository;

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
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Repository
@NullMarked
public class ErrorEventClickHouseRepository {

    private static final Logger log = LoggerFactory.getLogger(ErrorEventClickHouseRepository.class);

    private final DataSource clickHouseDataSource;

    public ErrorEventClickHouseRepository(@Qualifier("clickHouseDataSource") DataSource clickHouseDataSource) {
        this.clickHouseDataSource = clickHouseDataSource;
    }

    public @Nullable ErrorEventRow findLatest(UUID projectId, String fingerprint) {
        String sql = """
                SELECT id, message, stack_trace, level, environment, release,
                       user_id, user_email, user_ip, metadata, timestamp
                FROM seestack.errors
                WHERE project_id = ? AND fingerprint = ?
                ORDER BY timestamp DESC
                LIMIT 1
                """;
        try (Connection conn = clickHouseDataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, projectId.toString());
            ps.setString(2, fingerprint);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return mapRow(rs);
            }
        } catch (Exception e) {
            log.warn("ClickHouse findLatest failed for {}: {}", fingerprint, e.getMessage());
        }
        return null;
    }

    /** Hourly counts for the last {@code hours} hours. */
    public List<TimelineBucket> hourlyTimeline(UUID projectId, String fingerprint, int hours) {
        String sql = """
                SELECT toStartOfHour(timestamp) AS bucket, count() AS c
                FROM seestack.errors
                WHERE project_id = ? AND fingerprint = ?
                  AND timestamp >= now() - INTERVAL ? HOUR
                GROUP BY bucket
                ORDER BY bucket ASC
                """;
        List<TimelineBucket> rows = new ArrayList<>();
        try (Connection conn = clickHouseDataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, projectId.toString());
            ps.setString(2, fingerprint);
            ps.setInt(3, hours);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    rows.add(new TimelineBucket(rs.getTimestamp("bucket").toInstant(), rs.getLong("c")));
                }
            }
        } catch (Exception e) {
            log.warn("ClickHouse hourlyTimeline failed for {}: {}", fingerprint, e.getMessage());
        }
        return rows;
    }

    public record TimelineBucket(Instant bucket, long count) {}

    public List<ErrorEventRow> findRecent(UUID projectId, String fingerprint, int limit) {
        String sql = """
                SELECT id, message, stack_trace, level, environment, release,
                       user_id, user_email, user_ip, metadata, timestamp
                FROM seestack.errors
                WHERE project_id = ? AND fingerprint = ?
                ORDER BY timestamp DESC
                LIMIT ?
                """;
        List<ErrorEventRow> rows = new ArrayList<>();
        try (Connection conn = clickHouseDataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, projectId.toString());
            ps.setString(2, fingerprint);
            ps.setInt(3, limit);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) rows.add(mapRow(rs));
            }
        } catch (Exception e) {
            log.warn("ClickHouse findRecent failed for {}: {}", fingerprint, e.getMessage());
        }
        return rows;
    }

    private ErrorEventRow mapRow(ResultSet rs) throws java.sql.SQLException {
        return new ErrorEventRow(
                rs.getString("id"),
                rs.getString("message"),
                rs.getString("stack_trace"),
                rs.getString("level"),
                rs.getString("environment"),
                rs.getString("release"),
                rs.getString("user_id"),
                rs.getString("user_email"),
                rs.getString("user_ip"),
                rs.getString("metadata"),
                rs.getTimestamp("timestamp").toInstant()
        );
    }

    public record ErrorEventRow(
            String id,
            String message,
            String stackTrace,
            String level,
            String environment,
            String release,
            String userId,
            String userEmail,
            String userIp,
            String metadata,
            Instant timestamp
    ) {}
}
