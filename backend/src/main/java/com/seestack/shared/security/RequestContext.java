package com.seestack.shared.security;

import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;

/**
 * Holds per-request context extracted from the Keycloak JWT.
 *
 * NOTE: Uses ThreadLocal for Java 17 compatibility.
 * When running on Java 21+, this can be replaced with ScopedValue for
 * safer, immutable per-thread-scope sharing (Java 25 / Spring Boot 4 target).
 */
@NullMarked
public record RequestContext(
        String keycloakId,
        String email,
        @Nullable String userId
) {
    public static final ThreadLocal<RequestContext> CURRENT = new ThreadLocal<>();

    public static @Nullable RequestContext get() {
        return CURRENT.get();
    }
}
