package com.seestack.ingestion.clickhouse;

import com.seestack.ingestion.kafka.LogKafkaEvent;
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
import java.util.Map;
import java.sql.PreparedStatement;
import java.sql.Timestamp;
import java.time.Instant;

@Component
@NullMarked
public class LogClickHouseWriter {

    private static final Logger log = LoggerFactory.getLogger(LogClickHouseWriter.class);

    private static final String INSERT_SQL = """
            INSERT INTO seestack.logs
              (id, project_id, level, message, service, trace_id, metadata, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """;

    private final DataSource clickHouseDataSource;
    private final ObjectMapper objectMapper;

    public LogClickHouseWriter(@Qualifier("clickHouseDataSource") DataSource clickHouseDataSource,
                               ObjectMapper objectMapper) {
        this.clickHouseDataSource = clickHouseDataSource;
        this.objectMapper = objectMapper;
    }

    public void write(LogKafkaEvent event) {
        try (Connection conn = clickHouseDataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(INSERT_SQL)) {

            ps.setString(1, event.eventId().toString());
            ps.setString(2, event.projectId().toString());
            ps.setString(3, event.level());
            ps.setString(4, event.message());
            ps.setString(5, nullToEmpty(event.service()));
            ps.setString(6, nullToEmpty(event.traceId()));
            ps.setString(7, serializeMetadata(event.metadata()));
            ps.setTimestamp(8, Timestamp.from(Instant.ofEpochMilli(event.timestampMillis())));

            ps.executeUpdate();
        } catch (Exception e) {
            log.error("Failed to write log event {} to ClickHouse", event.eventId(), e);
            throw new RuntimeException("ClickHouse write failed", e);
        }
    }

    private String nullToEmpty(@Nullable String value) {
        return value != null ? value : "";
    }

    private String serializeMetadata(@Nullable Map<String, Object> metadata) {
        if (metadata == null) return "{}";
        try {
            return objectMapper.writeValueAsString(metadata);
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize log metadata");
            return "{}";
        }
    }
}
