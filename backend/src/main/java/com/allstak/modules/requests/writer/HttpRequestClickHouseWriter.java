package com.allstak.modules.requests.writer;

import com.allstak.modules.requests.kafka.HttpRequestKafkaEvent;
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
public class HttpRequestClickHouseWriter {

    private static final Logger log = LoggerFactory.getLogger(HttpRequestClickHouseWriter.class);

    private static final DateTimeFormatter CH_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS").withZone(ZoneOffset.UTC);

    private static final String INSERT_SQL = """
            INSERT INTO allstak.http_requests
            (project_id, trace_id, direction, method, host, path, status_code,
             duration_ms, request_size, response_size, user_id, error_fingerprint, is_slow, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """;

    private final DataSource clickHouseDataSource;

    public HttpRequestClickHouseWriter(@Qualifier("clickHouseDataSource") DataSource clickHouseDataSource) {
        this.clickHouseDataSource = clickHouseDataSource;
    }

    public void write(HttpRequestKafkaEvent event) {
        try (Connection conn = clickHouseDataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(INSERT_SQL)) {

            ps.setString(1, event.projectId().toString());
            ps.setString(2, event.traceId());
            ps.setString(3, event.direction());
            ps.setString(4, event.method());
            ps.setString(5, event.host());
            ps.setString(6, event.path());
            ps.setInt(7, event.statusCode());
            ps.setInt(8, event.durationMs());
            ps.setInt(9, event.requestSize());
            ps.setInt(10, event.responseSize());
            ps.setString(11, event.userId() != null ? event.userId() : "");
            ps.setString(12, event.errorFingerprint() != null ? event.errorFingerprint() : "");
            ps.setInt(13, event.isSlow());
            ps.setString(14, CH_FORMATTER.format(Instant.ofEpochMilli(event.timestampMillis())));

            ps.executeUpdate();
        } catch (Exception e) {
            log.error("Failed to write http_request to ClickHouse", e);
            throw new RuntimeException("ClickHouse write failed", e);
        }
    }
}
