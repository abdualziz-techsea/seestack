package com.seestack.modules.requests.service;

import com.seestack.modules.requests.dto.HttpRequestResponse;
import com.seestack.modules.requests.dto.HttpRequestStatsResponse;
import com.seestack.modules.requests.dto.TopHostEntry;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

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

@Service
@NullMarked
public class HttpRequestQueryService {

    private static final Logger log = LoggerFactory.getLogger(HttpRequestQueryService.class);
    private static final DateTimeFormatter CH_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS").withZone(ZoneOffset.UTC);

    private final DataSource clickHouseDataSource;

    public HttpRequestQueryService(@Qualifier("clickHouseDataSource") DataSource clickHouseDataSource) {
        this.clickHouseDataSource = clickHouseDataSource;
    }

    public record ListResult(List<HttpRequestResponse> items, long total) {}

    public ListResult list(UUID projectId, @Nullable String direction, @Nullable String method,
                           @Nullable String statusGroup, @Nullable String path,
                           @Nullable Instant from, @Nullable Instant to,
                           int page, int perPage) {
        if (from == null) from = Instant.now().minus(Duration.ofHours(24));
        if (to == null) to = Instant.now();

        var conditions = new ArrayList<String>();
        var params = new ArrayList<Object>();

        conditions.add("project_id = ?");
        params.add(projectId.toString());

        conditions.add("timestamp >= toDateTime64(?, 3)");
        params.add(CH_FORMATTER.format(from));

        conditions.add("timestamp <= toDateTime64(?, 3)");
        params.add(CH_FORMATTER.format(to));

        if (direction != null && !direction.isBlank()) {
            conditions.add("direction = ?");
            params.add(direction);
        }
        if (method != null && !method.isBlank()) {
            conditions.add("method = ?");
            params.add(method.toUpperCase());
        }
        if (statusGroup != null && !statusGroup.isBlank()) {
            int[] range = statusGroupToRange(statusGroup);
            if (range != null) {
                conditions.add("status_code >= ? AND status_code < ?");
                params.add(range[0]);
                params.add(range[1]);
            }
        }
        if (path != null && !path.isBlank()) {
            conditions.add("lower(path) LIKE lower(?)");
            params.add("%" + path + "%");
        }

        String where = String.join(" AND ", conditions);
        int offset = Math.max(0, page - 1) * perPage;

        try (Connection conn = clickHouseDataSource.getConnection()) {
            // Count
            long total;
            try (PreparedStatement ps = conn.prepareStatement("SELECT count() FROM seestack.http_requests WHERE " + where)) {
                for (int i = 0; i < params.size(); i++) ps.setObject(i + 1, params.get(i));
                try (ResultSet rs = ps.executeQuery()) { rs.next(); total = rs.getLong(1); }
            }

            // Query
            List<HttpRequestResponse> items = new ArrayList<>();
            String query = "SELECT id, trace_id, direction, method, host, path, status_code, duration_ms, is_slow, user_id, error_fingerprint, timestamp " +
                    "FROM seestack.http_requests WHERE " + where + " ORDER BY timestamp DESC LIMIT ? OFFSET ?";
            try (PreparedStatement ps = conn.prepareStatement(query)) {
                for (int i = 0; i < params.size(); i++) ps.setObject(i + 1, params.get(i));
                ps.setInt(params.size() + 1, perPage);
                ps.setInt(params.size() + 2, offset);
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        items.add(new HttpRequestResponse(
                                UUID.fromString(rs.getString("id")),
                                rs.getString("trace_id"),
                                rs.getString("direction"),
                                rs.getString("method"),
                                rs.getString("host"),
                                rs.getString("path"),
                                rs.getInt("status_code"),
                                rs.getInt("duration_ms"),
                                rs.getInt("is_slow") == 1,
                                rs.getString("user_id"),
                                rs.getString("error_fingerprint"),
                                rs.getTimestamp("timestamp").toInstant()
                        ));
                    }
                }
            }
            return new ListResult(items, total);
        } catch (Exception e) {
            log.error("Failed to query http_requests", e);
            throw new RuntimeException("ClickHouse query failed", e);
        }
    }

    public HttpRequestStatsResponse stats(UUID projectId, @Nullable Instant from, @Nullable Instant to) {
        if (from == null) from = Instant.now().minus(Duration.ofHours(24));
        if (to == null) to = Instant.now();

        String sql = """
                SELECT
                    count() as total,
                    countIf(status_code >= 400) as errors,
                    countIf(is_slow = 1) as slow,
                    quantile(0.50)(duration_ms) as p50,
                    quantile(0.95)(duration_ms) as p95,
                    quantile(0.99)(duration_ms) as p99,
                    countIf(direction = 'inbound') as inbound,
                    countIf(direction = 'outbound') as outbound
                FROM seestack.http_requests
                WHERE project_id = ? AND timestamp >= toDateTime64(?, 3) AND timestamp <= toDateTime64(?, 3)
                """;

        try (Connection conn = clickHouseDataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, projectId.toString());
            ps.setString(2, CH_FORMATTER.format(from));
            ps.setString(3, CH_FORMATTER.format(to));

            try (ResultSet rs = ps.executeQuery()) {
                rs.next();
                long total = rs.getLong("total");
                long errors = rs.getLong("errors");
                long slow = rs.getLong("slow");
                double errorRate = total > 0 ? Math.round(errors * 10000.0 / total) / 100.0 : 0;
                double slowRate = total > 0 ? Math.round(slow * 10000.0 / total) / 100.0 : 0;

                return new HttpRequestStatsResponse(
                        total, errorRate, slowRate,
                        rs.getLong("p50"), rs.getLong("p95"), rs.getLong("p99"),
                        rs.getLong("inbound"), rs.getLong("outbound")
                );
            }
        } catch (Exception e) {
            log.error("Failed to query http_requests stats", e);
            throw new RuntimeException("ClickHouse query failed", e);
        }
    }

    public List<TopHostEntry> topHosts(UUID projectId, @Nullable Instant from, @Nullable Instant to) {
        if (from == null) from = Instant.now().minus(Duration.ofHours(24));
        if (to == null) to = Instant.now();

        String sql = """
                SELECT
                    host,
                    count() as totalRequests,
                    countIf(status_code >= 400) as failedRequests,
                    round(countIf(status_code >= 400) / count() * 100, 2) as failureRate,
                    round(avg(duration_ms), 0) as avgDurationMs
                FROM seestack.http_requests
                WHERE project_id = ? AND direction = 'outbound'
                    AND timestamp >= toDateTime64(?, 3) AND timestamp <= toDateTime64(?, 3)
                GROUP BY host
                ORDER BY failedRequests DESC
                LIMIT 20
                """;

        try (Connection conn = clickHouseDataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, projectId.toString());
            ps.setString(2, CH_FORMATTER.format(from));
            ps.setString(3, CH_FORMATTER.format(to));

            List<TopHostEntry> items = new ArrayList<>();
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    items.add(new TopHostEntry(
                            rs.getString("host"),
                            rs.getLong("totalRequests"),
                            rs.getLong("failedRequests"),
                            rs.getDouble("failureRate"),
                            rs.getLong("avgDurationMs")
                    ));
                }
            }
            return items;
        } catch (Exception e) {
            log.error("Failed to query http_requests top-hosts", e);
            throw new RuntimeException("ClickHouse query failed", e);
        }
    }

    public List<HttpRequestResponse> byTrace(String traceId, UUID projectId) {
        String sql = """
                SELECT id, trace_id, direction, method, host, path, status_code, duration_ms, is_slow,
                       user_id, error_fingerprint, timestamp
                FROM seestack.http_requests
                WHERE trace_id = ? AND project_id = ?
                ORDER BY timestamp ASC
                LIMIT 100
                """;

        try (Connection conn = clickHouseDataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, traceId);
            ps.setString(2, projectId.toString());

            List<HttpRequestResponse> items = new ArrayList<>();
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    items.add(new HttpRequestResponse(
                            UUID.fromString(rs.getString("id")),
                            rs.getString("trace_id"),
                            rs.getString("direction"),
                            rs.getString("method"),
                            rs.getString("host"),
                            rs.getString("path"),
                            rs.getInt("status_code"),
                            rs.getInt("duration_ms"),
                            rs.getInt("is_slow") == 1,
                            rs.getString("user_id"),
                            rs.getString("error_fingerprint"),
                            rs.getTimestamp("timestamp").toInstant()
                    ));
                }
            }
            return items;
        } catch (Exception e) {
            log.error("Failed to query http_requests by trace", e);
            throw new RuntimeException("ClickHouse query failed", e);
        }
    }

    private static int @Nullable [] statusGroupToRange(String group) {
        return switch (group.toLowerCase()) {
            case "2xx" -> new int[]{200, 300};
            case "3xx" -> new int[]{300, 400};
            case "4xx" -> new int[]{400, 500};
            case "5xx" -> new int[]{500, 600};
            default -> null;
        };
    }
}
