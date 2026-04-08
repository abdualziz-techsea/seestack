package com.seestack.modules.logs.repository;

import com.seestack.modules.logs.dto.LogResponse;
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
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Repository
@NullMarked
public class LogClickHouseRepository {

    private static final Logger log = LoggerFactory.getLogger(LogClickHouseRepository.class);

    private final DataSource clickHouseDataSource;

    public LogClickHouseRepository(@Qualifier("clickHouseDataSource") DataSource clickHouseDataSource) {
        this.clickHouseDataSource = clickHouseDataSource;
    }

    public LogQueryResult search(UUID projectId, @Nullable String level, @Nullable String service,
                                  @Nullable String search, @Nullable Instant startTime,
                                  @Nullable Instant endTime, int page, int perPage) {
        var conditions = new ArrayList<String>();
        var params = new ArrayList<Object>();

        conditions.add("project_id = ?");
        params.add(projectId.toString());

        if (level != null && !level.isBlank()) {
            conditions.add("level = ?");
            params.add(level);
        }
        if (service != null && !service.isBlank()) {
            conditions.add("service = ?");
            params.add(service);
        }
        if (search != null && !search.isBlank()) {
            conditions.add("(message ILIKE ? OR service ILIKE ?)");
            String pattern = "%" + search + "%";
            params.add(pattern);
            params.add(pattern);
        }
        if (startTime != null) {
            conditions.add("timestamp >= toDateTime64(?, 3)");
            params.add(formatForClickHouse(startTime));
        }
        if (endTime != null) {
            conditions.add("timestamp <= toDateTime64(?, 3)");
            params.add(formatForClickHouse(endTime));
        }

        String whereClause = String.join(" AND ", conditions);
        int offset = Math.max(0, page - 1) * perPage;

        String countSql = "SELECT count() FROM seestack.logs WHERE " + whereClause;
        String querySql = "SELECT id, project_id, level, message, service, trace_id, metadata, timestamp " +
                "FROM seestack.logs WHERE " + whereClause +
                " ORDER BY timestamp DESC LIMIT ? OFFSET ?";

        try (Connection conn = clickHouseDataSource.getConnection()) {
            // Count
            long total;
            try (PreparedStatement ps = conn.prepareStatement(countSql)) {
                for (int i = 0; i < params.size(); i++) {
                    ps.setObject(i + 1, params.get(i));
                }
                try (ResultSet rs = ps.executeQuery()) {
                    rs.next();
                    total = rs.getLong(1);
                }
            }

            // Query
            List<LogResponse> items = new ArrayList<>();
            try (PreparedStatement ps = conn.prepareStatement(querySql)) {
                for (int i = 0; i < params.size(); i++) {
                    ps.setObject(i + 1, params.get(i));
                }
                ps.setInt(params.size() + 1, perPage);
                ps.setInt(params.size() + 2, offset);

                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        items.add(new LogResponse(
                                UUID.fromString(rs.getString("id")),
                                UUID.fromString(rs.getString("project_id")),
                                rs.getString("level"),
                                rs.getString("message"),
                                emptyToNull(rs.getString("service")),
                                emptyToNull(rs.getString("trace_id")),
                                emptyToNull(rs.getString("metadata")),
                                rs.getTimestamp("timestamp").toInstant()
                        ));
                    }
                }
            }

            return new LogQueryResult(items, total);
        } catch (Exception e) {
            log.error("Failed to query logs from ClickHouse", e);
            throw new RuntimeException("ClickHouse query failed", e);
        }
    }

    private static final DateTimeFormatter CH_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS").withZone(ZoneOffset.UTC);

    private String formatForClickHouse(Instant instant) {
        return CH_FORMATTER.format(instant);
    }

    private @Nullable String emptyToNull(@Nullable String value) {
        return (value == null || value.isEmpty() || "{}".equals(value)) ? null : value;
    }

    public record LogQueryResult(List<LogResponse> items, long total) {}
}
