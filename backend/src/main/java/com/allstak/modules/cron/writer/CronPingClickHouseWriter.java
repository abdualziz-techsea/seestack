package com.allstak.modules.cron.writer;

import com.allstak.modules.cron.kafka.CronPingKafkaEvent;
import org.jspecify.annotations.NullMarked;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

@Component
@NullMarked
public class CronPingClickHouseWriter {

    private static final Logger log = LoggerFactory.getLogger(CronPingClickHouseWriter.class);
    private static final DateTimeFormatter CH_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS").withZone(ZoneOffset.UTC);

    private static final String INSERT_SQL = """
            INSERT INTO allstak.cron_pings (monitor_id, project_id, status, duration_ms, message, timestamp)
            VALUES (?, ?, ?, ?, ?, ?)
            """;

    private final DataSource clickHouseDataSource;

    public CronPingClickHouseWriter(@Qualifier("clickHouseDataSource") DataSource clickHouseDataSource) {
        this.clickHouseDataSource = clickHouseDataSource;
    }

    public void write(CronPingKafkaEvent event) {
        try (Connection conn = clickHouseDataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(INSERT_SQL)) {
            ps.setString(1, event.monitorId().toString());
            ps.setString(2, event.projectId().toString());
            ps.setString(3, event.status());
            ps.setLong(4, event.durationMs());
            ps.setString(5, event.message() != null ? event.message() : "");
            ps.setString(6, CH_FORMATTER.format(Instant.ofEpochMilli(event.timestampMillis())));
            ps.executeUpdate();
        } catch (Exception e) {
            log.error("Failed to write cron_ping to ClickHouse", e);
            throw new RuntimeException("ClickHouse write failed", e);
        }
    }
}
