package com.seestack.modules.cron;

import com.seestack.modules.cron.service.CronScheduleParser;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

class CronScheduleParserTest {

    private final CronScheduleParser parser = new CronScheduleParser();

    @Test
    void interval1h() {
        Instant base = Instant.parse("2025-01-01T10:00:00Z");
        Instant next = parser.computeNextExpectedAt(base, base, "1h");
        assertEquals(base.plus(Duration.ofHours(1)), next);
    }

    @Test
    void interval30m() {
        Instant base = Instant.parse("2025-01-01T10:00:00Z");
        Instant next = parser.computeNextExpectedAt(base, base, "30m");
        assertEquals(base.plus(Duration.ofMinutes(30)), next);
    }

    @Test
    void interval1d() {
        Instant base = Instant.parse("2025-01-01T10:00:00Z");
        Instant next = parser.computeNextExpectedAt(base, base, "1d");
        assertEquals(base.plus(Duration.ofDays(1)), next);
    }

    @Test
    void cronDaily() {
        Instant base = Instant.parse("2025-01-01T02:00:00Z");
        Instant next = parser.computeNextExpectedAt(base, base, "0 2 * * *");
        // Next occurrence after 2025-01-01T02:00:00Z should be 2025-01-02T02:00:00Z
        assertEquals(Instant.parse("2025-01-02T02:00:00Z"), next);
    }

    @Test
    void nullLastPing_usesCreatedAt() {
        Instant created = Instant.parse("2025-01-01T00:00:00Z");
        Instant next = parser.computeNextExpectedAt(null, created, "1h");
        assertEquals(created.plus(Duration.ofHours(1)), next);
    }
}
