package com.allstak.modules.cron.service;

import com.allstak.modules.cron.dto.CronPingResponse;
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
public class CronPingQueryService {

    private static final Logger log = LoggerFactory.getLogger(CronPingQueryService.class);
    private static final DateTimeFormatter CH_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS").withZone(ZoneOffset.UTC);

    private final DataSource clickHouseDataSource;

    public CronPingQueryService(@Qualifier("clickHouseDataSource") DataSource clickHouseDataSource) {
        this.clickHouseDataSource = clickHouseDataSource;
    }

    public @Nullable CronPingResponse findLastPing(UUID monitorId) {
        String sql = "SELECT id, status, duration_ms, message, timestamp FROM allstak.cron_pings WHERE monitor_id = ? ORDER BY timestamp DESC LIMIT 1";
        try (Connection conn = clickHouseDataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, monitorId.toString());
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return new CronPingResponse(
                            UUID.fromString(rs.getString("id")),
                            rs.getString("status"),
                            rs.getLong("duration_ms"),
                            rs.getString("message"),
                            rs.getTimestamp("timestamp").toInstant()
                    );
                }
            }
        } catch (Exception e) {
            log.error("Failed to query last ping for monitor {}", monitorId, e);
        }
        return null;
    }

    public boolean hasMissedPingAfter(UUID monitorId, Instant after) {
        String sql = "SELECT count() FROM allstak.cron_pings WHERE monitor_id = ? AND status = 'missed' AND timestamp >= toDateTime64(?, 3)";
        try (Connection conn = clickHouseDataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, monitorId.toString());
            ps.setString(2, CH_FORMATTER.format(after));
            try (ResultSet rs = ps.executeQuery()) {
                rs.next();
                return rs.getLong(1) > 0;
            }
        } catch (Exception e) {
            log.error("Failed to check missed ping for monitor {}", monitorId, e);
        }
        return false;
    }

    public double avgDurationLastN(UUID monitorId, int n) {
        String sql = "SELECT avg(duration_ms) as avg_dur FROM (SELECT duration_ms FROM allstak.cron_pings WHERE monitor_id = ? AND status = 'success' AND duration_ms > 0 ORDER BY timestamp DESC LIMIT ?)";
        try (Connection conn = clickHouseDataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, monitorId.toString());
            ps.setInt(2, n);
            try (ResultSet rs = ps.executeQuery()) {
                rs.next();
                return rs.getDouble("avg_dur");
            }
        } catch (Exception e) {
            log.error("Failed to query avg duration for monitor {}", monitorId, e);
        }
        return 0;
    }

    public record HistoryResult(List<CronPingResponse> items, long total) {}

    public HistoryResult getHistory(UUID monitorId, @Nullable String status,
                                     @Nullable Instant from, @Nullable Instant to,
                                     int page, int perPage) {
        if (from == null) from = Instant.now().minus(Duration.ofDays(7));
        if (to == null) to = Instant.now();

        var conditions = new ArrayList<String>();
        var params = new ArrayList<Object>();

        conditions.add("monitor_id = ?");
        params.add(monitorId.toString());
        conditions.add("timestamp >= toDateTime64(?, 3)");
        params.add(CH_FORMATTER.format(from));
        conditions.add("timestamp <= toDateTime64(?, 3)");
        params.add(CH_FORMATTER.format(to));

        if (status != null && !status.isBlank()) {
            conditions.add("status = ?");
            params.add(status);
        }

        String where = String.join(" AND ", conditions);
        int offset = Math.max(0, page - 1) * perPage;

        try (Connection conn = clickHouseDataSource.getConnection()) {
            long total;
            try (PreparedStatement ps = conn.prepareStatement("SELECT count() FROM allstak.cron_pings WHERE " + where)) {
                for (int i = 0; i < params.size(); i++) ps.setObject(i + 1, params.get(i));
                try (ResultSet rs = ps.executeQuery()) { rs.next(); total = rs.getLong(1); }
            }

            List<CronPingResponse> items = new ArrayList<>();
            String query = "SELECT id, status, duration_ms, message, timestamp FROM allstak.cron_pings WHERE " + where + " ORDER BY timestamp DESC LIMIT ? OFFSET ?";
            try (PreparedStatement ps = conn.prepareStatement(query)) {
                for (int i = 0; i < params.size(); i++) ps.setObject(i + 1, params.get(i));
                ps.setInt(params.size() + 1, perPage);
                ps.setInt(params.size() + 2, offset);
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        items.add(new CronPingResponse(
                                UUID.fromString(rs.getString("id")),
                                rs.getString("status"),
                                rs.getLong("duration_ms"),
                                rs.getString("message"),
                                rs.getTimestamp("timestamp").toInstant()
                        ));
                    }
                }
            }
            return new HistoryResult(items, total);
        } catch (Exception e) {
            log.error("Failed to query cron ping history", e);
            throw new RuntimeException("ClickHouse query failed", e);
        }
    }
}
