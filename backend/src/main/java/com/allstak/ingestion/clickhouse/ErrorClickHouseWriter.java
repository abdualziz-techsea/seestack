package com.allstak.ingestion.clickhouse;

import com.allstak.ingestion.kafka.ErrorKafkaEvent;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import java.util.List;

@Component
@NullMarked
public class ErrorClickHouseWriter {

    private static final Logger log = LoggerFactory.getLogger(ErrorClickHouseWriter.class);

    private static final String INSERT_SQL = """
            INSERT INTO allstak.errors
              (id, project_id, fingerprint, exceptionClass, message, stack_trace, level,
               environment, release, user_id, user_email, user_ip, metadata, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """;

    private final DataSource clickHouseDataSource;
    private final ObjectMapper objectMapper;

    public ErrorClickHouseWriter(@Qualifier("clickHouseDataSource") DataSource clickHouseDataSource,
                                 ObjectMapper objectMapper) {
        this.clickHouseDataSource = clickHouseDataSource;
        this.objectMapper = objectMapper;
    }

    public void write(ErrorKafkaEvent event) {
        try (Connection conn = clickHouseDataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(INSERT_SQL)) {

            ps.setString(1, event.eventId().toString());
            ps.setString(2, event.projectId().toString());
            ps.setString(3, event.fingerprint());
            ps.setString(4, event.exceptionClass());
            ps.setString(5, event.message());
            ps.setString(6, joinFrames(event.stackTrace()));
            ps.setString(7, nullToEmpty(event.level()));
            ps.setString(8, nullToEmpty(event.environment()));
            ps.setString(9, nullToEmpty(event.release()));
            ps.setString(10, nullToEmpty(event.userId()));
            ps.setString(11, nullToEmpty(event.userEmail()));
            ps.setString(12, nullToEmpty(event.userIp()));
            ps.setString(13, serializeMetadata(event));
            ps.setTimestamp(14, Timestamp.from(Instant.ofEpochMilli(event.timestampMillis())));

            ps.executeUpdate();
        } catch (Exception e) {
            log.error("Failed to write error event {} to ClickHouse", event.eventId(), e);
            throw new RuntimeException("ClickHouse write failed", e);
        }
    }

    private String joinFrames(@Nullable List<String> frames) {
        if (frames == null || frames.isEmpty()) return "";
        return String.join("\n\tat ", frames);
    }

    private String nullToEmpty(@Nullable String value) {
        return value != null ? value : "";
    }

    private String serializeMetadata(ErrorKafkaEvent event) {
        if (event.metadata() == null) return "{}";
        try {
            return objectMapper.writeValueAsString(event.metadata());
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize metadata for event {}", event.eventId());
            return "{}";
        }
    }
}
