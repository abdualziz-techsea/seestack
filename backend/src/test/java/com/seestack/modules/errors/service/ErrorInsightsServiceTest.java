package com.seestack.modules.errors.service;

import com.seestack.modules.errors.entity.ErrorGroupEntity;
import com.seestack.modules.errors.repository.ErrorEventClickHouseRepository;
import com.seestack.modules.errors.repository.ErrorEventClickHouseRepository.ErrorEventRow;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class ErrorInsightsServiceTest {

    private static final Instant NOW = Instant.parse("2026-04-25T12:00:00Z");
    private static final UUID PROJECT = UUID.randomUUID();

    private final ErrorEventClickHouseRepository repo = mock(ErrorEventClickHouseRepository.class);
    private final ErrorInsightsService service =
            ErrorInsightsService.withClock(repo, Clock.fixed(NOW, ZoneOffset.UTC));

    private ErrorGroupEntity group(long occurrences, Instant firstSeen, Instant lastSeen) {
        ErrorGroupEntity g = new ErrorGroupEntity(
                PROJECT, "fp", "RuntimeException", "Boom",
                "error", "production", firstSeen);
        // Force the entity into the desired state via reflection (no setters by design).
        try {
            Field occ = ErrorGroupEntity.class.getDeclaredField("occurrences");
            occ.setAccessible(true); occ.set(g, occurrences);
            Field last = ErrorGroupEntity.class.getDeclaredField("lastSeen");
            last.setAccessible(true); last.set(g, lastSeen);
        } catch (Exception e) { throw new RuntimeException(e); }
        return g;
    }

    private ErrorEventRow row(String stack, String metadata) {
        return new ErrorEventRow("evt", "msg-" + UUID.randomUUID(), stack,
                "error", "production", "1.0.0",
                "u", "u@example.com", "1.2.3.4",
                metadata == null ? "{}" : metadata,
                NOW.minusSeconds(60));
    }

    @Test
    void recentActivity_isActive_whenLastSeenWithinOneHour() {
        when(repo.hourlyTimeline(any(), any(), anyInt())).thenReturn(List.of());
        var g = group(3, NOW.minusSeconds(7200), NOW.minusSeconds(120));
        var insights = service.compute(g, null, List.of());

        assertThat(insights.activeRecently()).isTrue();
        assertThat(insights.recentActivity()).isEqualTo("Active recently");
    }

    @Test
    void recentActivity_isInactive_whenLastSeenIsOlderThanOneHour() {
        when(repo.hourlyTimeline(any(), any(), anyInt())).thenReturn(List.of());
        var g = group(3, NOW.minusSeconds(86400), NOW.minusSeconds(7200));
        var insights = service.compute(g, null, List.of());

        assertThat(insights.activeRecently()).isFalse();
        assertThat(insights.recentActivity()).isEqualTo("No recent activity");
    }

    @Test
    void impact_isHigh_whenOccurrencesAreLargeAndRecent() {
        when(repo.hourlyTimeline(any(), any(), anyInt())).thenReturn(List.of());
        var g = group(30, NOW.minusSeconds(86400), NOW.minusSeconds(60));
        assertThat(service.compute(g, null, List.of()).impactLevel()).isEqualTo("HIGH");
    }

    @Test
    void impact_isMedium_whenOccurrencesAreModerateAndStale() {
        when(repo.hourlyTimeline(any(), any(), anyInt())).thenReturn(List.of());
        var g = group(8, NOW.minusSeconds(86400 * 2), NOW.minusSeconds(86400));
        assertThat(service.compute(g, null, List.of()).impactLevel()).isEqualTo("MEDIUM");
    }

    @Test
    void impact_isLow_whenSingleOccurrence() {
        when(repo.hourlyTimeline(any(), any(), anyInt())).thenReturn(List.of());
        var g = group(1, NOW.minusSeconds(7200), NOW.minusSeconds(7200));
        assertThat(service.compute(g, null, List.of()).impactLevel()).isEqualTo("LOW");
    }

    @Test
    void patterns_includeRepeatedTopFrameAndEndpoint() {
        when(repo.hourlyTimeline(any(), any(), anyInt())).thenReturn(List.of());
        var g = group(3, NOW.minusSeconds(7200), NOW.minusSeconds(60));
        var rows = List.of(
                row("at com.demo.A.b(A.java:1)", "{\"path\":\"/api/checkout\"}"),
                row("at com.demo.A.b(A.java:1)", "{\"path\":\"/api/checkout\"}"),
                row("at com.demo.A.b(A.java:1)", "{\"path\":\"/api/checkout\"}")
        );
        var insights = service.compute(g, rows.get(0), rows);

        assertThat(insights.patterns()).anyMatch(p -> p.contains("Same top stack frame"));
        assertThat(insights.patterns()).anyMatch(p -> p.contains("/api/checkout"));
    }

    @Test
    void fingerprint_explanationNormalizesNumbersAndUuids() {
        when(repo.hourlyTimeline(any(), any(), anyInt())).thenReturn(List.of());
        var g = group(1, NOW.minusSeconds(60), NOW.minusSeconds(60));
        var latest = new ErrorEventRow("evt", "Order 1234 missing — id=11111111-2222-3333-4444-555555555555",
                "at com.demo.X.y(X.java:10)", "error", "prod", "1.0", "u", "e", "ip", "{}", NOW);

        var insights = service.compute(g, latest, List.of());
        assertThat(insights.fingerprint().normalizedMessage()).contains("<n>");
        assertThat(insights.fingerprint().normalizedMessage()).contains("<uuid>");
        assertThat(insights.fingerprint().topFrame()).isEqualTo("at com.demo.X.y(X.java:10)");
    }

    @Test
    void toMap_doesNotExposeRemovedFrequencyFields() {
        when(repo.hourlyTimeline(any(), any(), anyInt())).thenReturn(List.of());
        var g = group(5, NOW.minusSeconds(7200), NOW.minusSeconds(60));
        var map = service.compute(g, null, List.of()).toMap();

        // Regression guard: these confusing rate fields must NOT come back.
        assertThat(map).doesNotContainKeys("perMinute", "perHour", "averagePerHour", "lastHourCount", "spike");
        assertThat(map).containsKeys("impactLevel", "recentActivity", "activeRecently",
                "totalOccurrences", "firstSeen", "lastSeen", "patterns", "fingerprint", "timeline");
    }
}
