package com.allstak.modules.monitors.repository;

import com.allstak.modules.monitors.dto.MonitorCheckResponse;
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
public class MonitorCheckClickHouseRepository {

    private static final Logger log = LoggerFactory.getLogger(MonitorCheckClickHouseRepository.class);

    private static final DateTimeFormatter CH_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS").withZone(ZoneOffset.UTC);

    private final DataSource clickHouseDataSource;

    public MonitorCheckClickHouseRepository(@Qualifier("clickHouseDataSource") DataSource clickHouseDataSource) {
        this.clickHouseDataSource = clickHouseDataSource;
    }

    public CheckHistoryResult getCheckHistory(UUID monitorId, @Nullable String timeRange) {
        Instant since = resolveTimeRange(timeRange);
        String sinceStr = CH_FORMATTER.format(since);

        String querySql = """
                SELECT status, response_time_ms, status_code, timestamp
                FROM allstak.monitor_checks
                WHERE monitor_id = ? AND timestamp >= toDateTime64(?, 3)
                ORDER BY timestamp DESC
                LIMIT 1000
                """;

        String uptimeSql = """
                SELECT count() as total, sum(status) as up_count
                FROM allstak.monitor_checks
                WHERE monitor_id = ? AND timestamp >= toDateTime64(?, 3)
                """;

        try (Connection conn = clickHouseDataSource.getConnection()) {
            // Uptime
            double uptimePercentage = 0.0;
            long totalChecks = 0;
            try (PreparedStatement ps = conn.prepareStatement(uptimeSql)) {
                ps.setString(1, monitorId.toString());
                ps.setString(2, sinceStr);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        totalChecks = rs.getLong("total");
                        long upCount = rs.getLong("up_count");
                        uptimePercentage = totalChecks > 0
                                ? Math.round(upCount * 10000.0 / totalChecks) / 100.0
                                : 0.0;
                    }
                }
            }

            // Check history
            List<MonitorCheckResponse> checks = new ArrayList<>();
            try (PreparedStatement ps = conn.prepareStatement(querySql)) {
                ps.setString(1, monitorId.toString());
                ps.setString(2, sinceStr);
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        checks.add(new MonitorCheckResponse(
                                rs.getTimestamp("timestamp").toInstant(),
                                rs.getInt("status"),
                                rs.getInt("response_time_ms"),
                                rs.getInt("status_code")
                        ));
                    }
                }
            }

            return new CheckHistoryResult(checks, uptimePercentage, totalChecks);
        } catch (Exception e) {
            log.error("Failed to query monitor checks from ClickHouse", e);
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

    /**
     * Get latest check status and 24h uptime for a list of monitors in one query.
     */
    public List<MonitorStatusSummary> getLatestStatusBatch(List<UUID> monitorIds) {
        if (monitorIds.isEmpty()) return List.of();

        String idList = monitorIds.stream()
                .map(id -> "'" + id + "'")
                .reduce((a, b) -> a + "," + b)
                .orElse("");

        Instant since24h = Instant.now().minus(Duration.ofHours(24));
        String sinceStr = CH_FORMATTER.format(since24h);

        // Get latest check per monitor + 24h uptime
        String sql = """
                SELECT
                    m.monitor_id,
                    m.status as last_status,
                    m.response_time_ms as last_response_time,
                    m.timestamp as last_checked_at,
                    u.total_checks,
                    u.up_count
                FROM (
                    SELECT monitor_id, status, response_time_ms, timestamp,
                           ROW_NUMBER() OVER (PARTITION BY monitor_id ORDER BY timestamp DESC) as rn
                    FROM allstak.monitor_checks
                    WHERE monitor_id IN (%s)
                ) m
                LEFT JOIN (
                    SELECT monitor_id, count() as total_checks, sum(status) as up_count
                    FROM allstak.monitor_checks
                    WHERE monitor_id IN (%s) AND timestamp >= toDateTime64(?, 3)
                    GROUP BY monitor_id
                ) u ON m.monitor_id = u.monitor_id
                WHERE m.rn = 1
                """.formatted(idList, idList);

        try (Connection conn = clickHouseDataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, sinceStr);
            List<MonitorStatusSummary> results = new ArrayList<>();
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    long total = rs.getLong("total_checks");
                    long up = rs.getLong("up_count");
                    double uptime = total > 0 ? Math.round(up * 10000.0 / total) / 100.0 : 0.0;
                    results.add(new MonitorStatusSummary(
                            UUID.fromString(rs.getString("monitor_id")),
                            rs.getInt("last_status"),
                            rs.getInt("last_response_time"),
                            rs.getTimestamp("last_checked_at").toInstant(),
                            uptime
                    ));
                }
            }
            return results;
        } catch (Exception e) {
            log.error("Failed to query monitor status batch from ClickHouse", e);
            return List.of();
        }
    }

    public record MonitorStatusSummary(
            UUID monitorId,
            int lastStatus,
            int lastResponseTimeMs,
            Instant lastCheckedAt,
            double uptimePercentage
    ) {}

    public record CheckHistoryResult(
            List<MonitorCheckResponse> checks,
            double uptimePercentage,
            long totalChecks
    ) {}
}
