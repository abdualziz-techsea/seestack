package com.seestack.modules.flags.dto;

import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;
import java.time.Instant;
import java.util.UUID;

@NullMarked
public record FlagAuditEntry(
        UUID id,
        String action,
        @Nullable Object oldValue,
        @Nullable Object newValue,
        @Nullable UUID userId,
        Instant createdAt
) {}
