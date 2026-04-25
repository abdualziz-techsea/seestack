package com.seestack.modules.errors.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.seestack.modules.errors.entity.ErrorGroupEntity;
import com.seestack.modules.errors.repository.ErrorEventClickHouseRepository.ErrorEventRow;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@NullMarked
public record ErrorDetailResponse(
        UUID id,
        String fingerprint,
        String exceptionClass,
        String title,
        @Nullable String message,
        @Nullable String level,
        @Nullable String environment,
        String status,
        long occurrences,
        Instant firstSeen,
        Instant lastSeen,
        String traceId,
        List<String> stackTrace,
        @Nullable String release,
        @Nullable UserContext userContext,
        @Nullable Map<String, Object> metadata,
        List<RecentOccurrence> recentOccurrences,
        @Nullable Map<String, Object> insights
) {
    public record UserContext(@Nullable String id, @Nullable String email, @Nullable String ip) {}

    public record RecentOccurrence(String id, Instant timestamp, @Nullable String environment, @Nullable String level) {}

    public static ErrorDetailResponse from(ErrorGroupEntity e, @Nullable ErrorEventRow latest,
                                           List<ErrorEventRow> recent, ObjectMapper objectMapper,
                                           @Nullable Map<String, Object> insights) {
        String message = latest != null ? latest.message() : null;
        String release = latest != null && !isBlank(latest.release()) ? latest.release() : null;
        List<String> stackTrace = latest != null ? splitStack(latest.stackTrace()) : List.of();

        UserContext user = null;
        if (latest != null && (notBlank(latest.userId()) || notBlank(latest.userEmail()) || notBlank(latest.userIp()))) {
            user = new UserContext(nullIfBlank(latest.userId()), nullIfBlank(latest.userEmail()), nullIfBlank(latest.userIp()));
        }

        Map<String, Object> metadata = null;
        if (latest != null && notBlank(latest.metadata()) && !"{}".equals(latest.metadata())) {
            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> parsed = objectMapper.readValue(latest.metadata(), Map.class);
                metadata = parsed;
            } catch (Exception ignored) {}
        }

        List<RecentOccurrence> occurrences = recent.stream()
                .map(r -> new RecentOccurrence(
                        r.id(),
                        r.timestamp(),
                        nullIfBlank(r.environment()),
                        nullIfBlank(r.level())))
                .toList();

        return new ErrorDetailResponse(
                e.getId(),
                e.getFingerprint(),
                e.getExceptionClass(),
                e.getTitle(),
                message,
                e.getLevel(),
                e.getEnvironment(),
                e.getStatus(),
                e.getOccurrences(),
                e.getFirstSeen(),
                e.getLastSeen(),
                e.getTraceId(),
                stackTrace,
                release,
                user,
                metadata,
                occurrences,
                insights
        );
    }

    /** Convenience overload that omits insights (used by AI controller). */
    public static ErrorDetailResponse from(ErrorGroupEntity e, @Nullable ErrorEventRow latest,
                                           List<ErrorEventRow> recent, ObjectMapper objectMapper) {
        return from(e, latest, recent, objectMapper, null);
    }

    private static List<String> splitStack(@Nullable String raw) {
        if (raw == null || raw.isBlank()) return List.of();
        return Arrays.stream(raw.split("\\n\\tat |\\r?\\n"))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }

    private static boolean isBlank(@Nullable String s) { return s == null || s.isBlank(); }
    private static boolean notBlank(@Nullable String s) { return s != null && !s.isBlank(); }
    private static @Nullable String nullIfBlank(@Nullable String s) { return notBlank(s) ? s : null; }
}
