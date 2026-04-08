package com.seestack.ingestion.clickhouse;

import com.seestack.ingestion.kafka.ReplayKafkaEvent;
import org.jspecify.annotations.NullMarked;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.Timestamp;
import java.time.Instant;

/**
 * Writes replay events to ClickHouse one at a time, matching the pattern
 * used by ErrorClickHouseWriter and other working writers.
 */
@Component
@NullMarked
public class ReplayClickHouseWriter {

    private static final Logger log = LoggerFactory.getLogger(ReplayClickHouseWriter.class);

    private static final String INSERT_SQL = """
            INSERT INTO seestack.replay_events
              (project_id, fingerprint, session_id, event_type, event_data, url, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """;

    private final DataSource clickHouseDataSource;

    public ReplayClickHouseWriter(@Qualifier("clickHouseDataSource") DataSource clickHouseDataSource) {
        this.clickHouseDataSource = clickHouseDataSource;
    }

    public void write(ReplayKafkaEvent event) {
        // Write each event with a separate connection, exactly like ErrorClickHouseWriter
        for (var item : event.events()) {
            writeOne(event.projectId().toString(), event.fingerprint(), event.sessionId(), item);
        }
        log.debug("Wrote {} replay events for fingerprint {}", event.events().size(), event.fingerprint());
    }

    private void writeOne(String projectId, String fingerprint, String sessionId,
                           ReplayKafkaEvent.ReplayEventItem item) {
        try (Connection conn = clickHouseDataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(INSERT_SQL)) {

            ps.setString(1, projectId);
            ps.setString(2, fingerprint);
            ps.setString(3, sessionId);
            ps.setString(4, item.eventType());
            ps.setString(5, item.eventData());
            ps.setString(6, item.url() != null ? item.url() : "");
            ps.setTimestamp(7, Timestamp.from(Instant.ofEpochMilli(item.timestampMillis())));

            ps.executeUpdate();
        } catch (Exception e) {
            log.error("Failed to write replay event to ClickHouse for fingerprint {}", fingerprint, e);
            throw new RuntimeException("ClickHouse write failed", e);
        }
    }
}
