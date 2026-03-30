package com.allstak.ingestion.clickhouse;

import com.allstak.ingestion.kafka.MonitorCheckKafkaEvent;
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

@Component
@NullMarked
public class MonitorCheckClickHouseWriter {

    private static final Logger log = LoggerFactory.getLogger(MonitorCheckClickHouseWriter.class);

    private static final String INSERT_SQL = """
            INSERT INTO allstak.monitor_checks
              (monitor_id, project_id, status, response_time_ms, status_code, timestamp)
            VALUES (?, ?, ?, ?, ?, ?)
            """;

    private final DataSource clickHouseDataSource;

    public MonitorCheckClickHouseWriter(@Qualifier("clickHouseDataSource") DataSource clickHouseDataSource) {
        this.clickHouseDataSource = clickHouseDataSource;
    }

    public void write(MonitorCheckKafkaEvent event) {
        try (Connection conn = clickHouseDataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(INSERT_SQL)) {

            ps.setString(1, event.monitorId().toString());
            ps.setString(2, event.projectId().toString());
            ps.setInt(3, event.status());
            ps.setInt(4, event.responseTimeMs());
            ps.setInt(5, event.statusCode());
            ps.setTimestamp(6, Timestamp.from(Instant.ofEpochMilli(event.timestampMillis())));

            ps.executeUpdate();
        } catch (Exception e) {
            log.error("Failed to write monitor check for {} to ClickHouse", event.monitorId(), e);
            throw new RuntimeException("ClickHouse write failed", e);
        }
    }
}
