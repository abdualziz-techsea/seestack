package com.allstak.modules.errors.dto;

import com.allstak.modules.errors.entity.ErrorGroupEntity;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;

import java.time.Instant;
import java.util.UUID;

@NullMarked
public record ErrorGroupResponse(
        UUID id,
        String fingerprint,
        String exceptionClass,
        String title,
        @Nullable String level,
        @Nullable String environment,
        String status,
        long occurrences,
        Instant firstSeen,
        Instant lastSeen,
        String traceId
) {
    public static ErrorGroupResponse from(ErrorGroupEntity e) {
        return new ErrorGroupResponse(
                e.getId(),
                e.getFingerprint(),
                e.getExceptionClass(),
                e.getTitle(),
                e.getLevel(),
                e.getEnvironment(),
                e.getStatus(),
                e.getOccurrences(),
                e.getFirstSeen(),
                e.getLastSeen(),
                e.getTraceId()
        );
    }
}
