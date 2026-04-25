package com.seestack.modules.errors.service;

import com.seestack.modules.errors.entity.ErrorGroupEntity;
import com.seestack.modules.errors.repository.ErrorEventClickHouseRepository;
import com.seestack.modules.errors.repository.ErrorEventClickHouseRepository.ErrorEventRow;
import com.seestack.modules.errors.repository.ErrorEventClickHouseRepository.TimelineBucket;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Computes simple, explainable insights for an error group.
 *
 * Every field is a clear function of stored data. We intentionally do NOT
 * publish per-minute / per-hour / average / last-hour rates — those numbers
 * are misleading on small samples and were removed after user feedback.
 *
 *   impactLevel     — LOW / MEDIUM / HIGH from total occurrences + recency
 *   recentActivity  — "Active recently" / "No recent activity"
 *   patterns        — repeated stack frame / repeated endpoint
 *   fingerprint     — exception class + normalized message + top frame + formula
 *   timeline        — hourly buckets for the last 24 hours
 */
@Service
@NullMarked
public class ErrorInsightsService {

    static final Duration RECENT_WINDOW = Duration.ofHours(1);

    private static final Pattern NUMBER = Pattern.compile("\\b\\d+\\b");
    private static final Pattern UUID_RE = Pattern.compile(
            "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}");

    private final ErrorEventClickHouseRepository eventRepo;
    private Clock clock;

    public ErrorInsightsService(ErrorEventClickHouseRepository eventRepo) {
        this.eventRepo = eventRepo;
        this.clock = Clock.systemUTC();
    }

    /** Visible-for-testing factory with an injectable clock. */
    static ErrorInsightsService withClock(ErrorEventClickHouseRepository eventRepo, Clock clock) {
        ErrorInsightsService s = new ErrorInsightsService(eventRepo);
        try {
            java.lang.reflect.Field f = ErrorInsightsService.class.getDeclaredField("clock");
            f.setAccessible(true); f.set(s, clock);
        } catch (Exception e) { throw new RuntimeException(e); }
        return s;
    }

    public Insights compute(ErrorGroupEntity group, @Nullable ErrorEventRow latest, List<ErrorEventRow> recent) {
        long total = group.getOccurrences();
        Instant now = clock.instant();
        Instant last = group.getLastSeen();

        long ageSeconds = Math.max(0, Duration.between(last, now).getSeconds());
        boolean activeRecently = ageSeconds < RECENT_WINDOW.toSeconds();
        String recentActivity = activeRecently ? "Active recently" : "No recent activity";

        // Impact: simple, explainable buckets.
        String impact;
        if (total >= 25) impact = "HIGH";
        else if (total >= 5) impact = activeRecently ? "HIGH" : "MEDIUM";
        else if (total >= 2 && activeRecently) impact = "MEDIUM";
        else impact = "LOW";

        // Pattern detection
        Map<String, Long> topFrameCounts = new LinkedHashMap<>();
        Map<String, Long> endpointCounts = new LinkedHashMap<>();
        for (ErrorEventRow row : recent) {
            String tf = topStackFrame(row.stackTrace());
            if (!tf.isEmpty()) topFrameCounts.merge(tf, 1L, Long::sum);

            String ep = extractEndpoint(row.metadata());
            if (!ep.isEmpty()) endpointCounts.merge(ep, 1L, Long::sum);
        }
        String repeatedFrame = topFrameCounts.entrySet().stream()
                .filter(e -> e.getValue() >= 2)
                .max(Comparator.comparingLong(Map.Entry::getValue))
                .map(Map.Entry::getKey).orElse("");
        String repeatedEndpoint = endpointCounts.entrySet().stream()
                .filter(e -> e.getValue() >= 2)
                .max(Comparator.comparingLong(Map.Entry::getValue))
                .map(Map.Entry::getKey).orElse("");

        List<String> patterns = new ArrayList<>();
        if (!repeatedFrame.isEmpty()) {
            patterns.add("Same top stack frame across recent occurrences: " + repeatedFrame);
        }
        if (!repeatedEndpoint.isEmpty()) {
            patterns.add("Same endpoint across recent occurrences: " + repeatedEndpoint);
        }
        if (patterns.isEmpty()) {
            patterns.add("No strong repeating pattern detected across recent occurrences.");
        }

        // Fingerprint explanation
        String topFrame = latest != null ? topStackFrame(latest.stackTrace()) : "";
        String normalizedMessage = latest != null ? normalize(latest.message()) : normalize(group.getTitle());
        FingerprintExplanation fp = new FingerprintExplanation(
                group.getExceptionClass(),
                normalizedMessage,
                topFrame,
                "fingerprint = sha256(exceptionClass + normalizedMessage + topMeaningfulFrame)"
        );

        // Timeline (hourly buckets, last 24h)
        List<TimelineBucket> raw = eventRepo.hourlyTimeline(group.getProjectId(), group.getFingerprint(), 24);
        List<TimelinePoint> timeline = raw.stream()
                .map(b -> new TimelinePoint(b.bucket(), b.count()))
                .toList();

        return new Insights(
                impact,
                recentActivity,
                activeRecently,
                total,
                group.getFirstSeen(),
                last,
                patterns,
                fp,
                timeline
        );
    }

    private static String topStackFrame(@Nullable String stack) {
        if (stack == null || stack.isBlank()) return "";
        String[] parts = stack.split("\\n");
        for (String p : parts) {
            String t = p.trim();
            if (t.isEmpty()) continue;
            return t;
        }
        return "";
    }

    private static String extractEndpoint(@Nullable String metadata) {
        if (metadata == null || metadata.isBlank() || "{}".equals(metadata)) return "";
        for (String key : List.of("\"path\"", "\"endpoint\"", "\"route\"", "\"url\"")) {
            int i = metadata.indexOf(key);
            if (i < 0) continue;
            int start = metadata.indexOf('"', i + key.length() + 1);
            if (start < 0) continue;
            int end = metadata.indexOf('"', start + 1);
            if (end < 0) continue;
            return metadata.substring(start + 1, end);
        }
        return "";
    }

    private static String normalize(@Nullable String message) {
        if (message == null) return "";
        String m = UUID_RE.matcher(message).replaceAll("<uuid>");
        m = NUMBER.matcher(m).replaceAll("<n>");
        return m.length() > 200 ? m.substring(0, 200) + "…" : m;
    }

    public record FingerprintExplanation(
            String exceptionClass,
            String normalizedMessage,
            String topFrame,
            String formula
    ) {}

    public record TimelinePoint(Instant bucket, long count) {}

    public record Insights(
            String impactLevel,
            String recentActivity,
            boolean activeRecently,
            long totalOccurrences,
            Instant firstSeen,
            Instant lastSeen,
            List<String> patterns,
            FingerprintExplanation fingerprint,
            List<TimelinePoint> timeline
    ) {
        public Map<String, Object> toMap() {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("impactLevel", impactLevel);
            m.put("recentActivity", recentActivity);
            m.put("activeRecently", activeRecently);
            m.put("totalOccurrences", totalOccurrences);
            m.put("firstSeen", firstSeen.toString());
            m.put("lastSeen", lastSeen.toString());
            m.put("patterns", patterns);
            m.put("fingerprint", Map.of(
                    "exceptionClass", fingerprint.exceptionClass(),
                    "normalizedMessage", fingerprint.normalizedMessage(),
                    "topFrame", fingerprint.topFrame(),
                    "formula", fingerprint.formula()
            ));
            m.put("timeline", timeline.stream().map(p -> Map.of(
                    "bucket", p.bucket().toString(),
                    "count", p.count()
            )).collect(Collectors.toList()));
            return m;
        }
    }
}
