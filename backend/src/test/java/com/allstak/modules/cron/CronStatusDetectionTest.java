package com.allstak.modules.cron;

import com.allstak.modules.cron.dto.CronPingResponse;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class CronStatusDetectionTest {

    // Simplified resolveStatus logic for unit testing
    private String resolveStatus(String lastPingStatus, Instant lastPingAt,
                                  Instant nextExpectedAt, int gracePeriodMin, Instant now) {
        if (lastPingStatus == null) return "pending";
        if ("failed".equals(lastPingStatus)) return "failed";

        Instant graceDeadline = nextExpectedAt.plus(Duration.ofMinutes(gracePeriodMin));

        if (now.isBefore(nextExpectedAt) || now.equals(nextExpectedAt)) return "healthy";
        if (now.isBefore(graceDeadline)) return "late";
        return "missed";
    }

    @Test
    void pending_noLastPing() {
        assertEquals("pending", resolveStatus(null, null, null, 5, Instant.now()));
    }

    @Test
    void healthy_withinSchedule() {
        Instant lastPing = Instant.now().minus(Duration.ofMinutes(10));
        Instant nextExpected = lastPing.plus(Duration.ofHours(1)); // in 50 min
        assertEquals("healthy", resolveStatus("success", lastPing, nextExpected, 5, Instant.now()));
    }

    @Test
    void late_pastScheduleWithinGrace() {
        Instant nextExpected = Instant.now().minus(Duration.ofMinutes(1)); // 1 min past
        assertEquals("late", resolveStatus("success", nextExpected.minus(Duration.ofHours(1)), nextExpected, 10, Instant.now()));
    }

    @Test
    void missed_pastGrace() {
        Instant nextExpected = Instant.now().minus(Duration.ofMinutes(10)); // 10 min past
        assertEquals("missed", resolveStatus("success", nextExpected.minus(Duration.ofHours(1)), nextExpected, 5, Instant.now()));
    }

    @Test
    void failed_overridesTiming() {
        Instant lastPing = Instant.now().minus(Duration.ofMinutes(1));
        Instant nextExpected = lastPing.plus(Duration.ofHours(1));
        assertEquals("failed", resolveStatus("failed", lastPing, nextExpected, 5, Instant.now()));
    }

    @Test
    void boundary_exactlyAtNextExpected_isHealthy() {
        Instant now = Instant.parse("2025-01-01T10:00:00Z");
        Instant nextExpected = now; // exactly at boundary
        assertEquals("healthy", resolveStatus("success", now.minus(Duration.ofHours(1)), nextExpected, 5, now));
    }

    @Test
    void boundary_exactlyAtGraceDeadline_isMissed() {
        Instant nextExpected = Instant.parse("2025-01-01T10:00:00Z");
        Instant graceDeadline = nextExpected.plus(Duration.ofMinutes(5));
        // now = graceDeadline → not before graceDeadline → missed
        assertEquals("missed", resolveStatus("success", nextExpected.minus(Duration.ofHours(1)), nextExpected, 5, graceDeadline));
    }
}
