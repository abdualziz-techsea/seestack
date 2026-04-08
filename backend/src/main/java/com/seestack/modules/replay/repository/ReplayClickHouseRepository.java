package com.seestack.modules.replay.repository;

import com.seestack.modules.replay.dto.ReplayEventResponse;
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
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Repository
@NullMarked
public class ReplayClickHouseRepository {

    private static final Logger log = LoggerFactory.getLogger(ReplayClickHouseRepository.class);

    private final DataSource clickHouseDataSource;

    public ReplayClickHouseRepository(@Qualifier("clickHouseDataSource") DataSource clickHouseDataSource) {
        this.clickHouseDataSource = clickHouseDataSource;
    }

    public List<ReplayEventResponse> getReplayEvents(UUID projectId, String fingerprint) {
        String sql = """
                SELECT event_type, event_data, url, timestamp
                FROM seestack.replay_events
                WHERE project_id = ? AND fingerprint = ?
                ORDER BY timestamp ASC
                LIMIT 5000
                """;

        try (Connection conn = clickHouseDataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, projectId.toString());
            ps.setString(2, fingerprint);

            List<ReplayEventResponse> events = new ArrayList<>();
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    events.add(new ReplayEventResponse(
                            rs.getString("event_type"),
                            rs.getString("event_data"),
                            emptyToNull(rs.getString("url")),
                            rs.getTimestamp("timestamp").toInstant()
                    ));
                }
            }
            return events;
        } catch (Exception e) {
            log.error("Failed to query replay events from ClickHouse", e);
            throw new RuntimeException("ClickHouse query failed", e);
        }
    }

    private @Nullable String emptyToNull(@Nullable String value) {
        return (value == null || value.isEmpty()) ? null : value;
    }
}
