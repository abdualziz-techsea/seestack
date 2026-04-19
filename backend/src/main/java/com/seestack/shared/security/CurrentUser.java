package com.seestack.shared.security;

import org.jspecify.annotations.NullMarked;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

/**
 * Accessor for the currently-authenticated user's id, resolved from the
 * {@link JwtAuthFilter.AuthDetails} attached to the SecurityContext.
 */
@NullMarked
public final class CurrentUser {

    private CurrentUser() {}

    public static UUID requireUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getDetails() instanceof JwtAuthFilter.AuthDetails d) || d.userId() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return UUID.fromString(d.userId());
    }
}
