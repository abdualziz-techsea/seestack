package com.allstak.ingestion.clickhouse;

import com.allstak.ingestion.kafka.SshAuditKafkaEvent;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;
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
public class SshAuditClickHouseWriter {

    private static final Logger log = LoggerFactory.getLogger(SshAuditClickHouseWriter.class);

    private static final String INSERT_SQL = """
            INSERT INTO allstak.ssh_audit_logs
              (server_id, project_id, user_id, command, output, timestamp)
            VALUES (?, ?, ?, ?, ?, ?)
            """;

    private final DataSource clickHouseDataSource;

    public SshAuditClickHouseWriter(@Qualifier("clickHouseDataSource") DataSource clickHouseDataSource) {
        this.clickHouseDataSource = clickHouseDataSource;
    }

    public void write(SshAuditKafkaEvent event) {
        try (Connection conn = clickHouseDataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(INSERT_SQL)) {

            ps.setString(1, event.serverId().toString());
            ps.setString(2, event.projectId().toString());
            ps.setString(3, event.userId().toString());
            ps.setString(4, nullToEmpty(event.command()));
            ps.setString(5, nullToEmpty(event.output()));
            ps.setTimestamp(6, Timestamp.from(Instant.ofEpochMilli(event.timestampMillis())));

            ps.executeUpdate();
        } catch (Exception e) {
            log.error("Failed to write SSH audit log to ClickHouse", e);
            throw new RuntimeException("ClickHouse write failed", e);
        }
    }

    private String nullToEmpty(@Nullable String value) {
        return value != null ? value : "";
    }
}
