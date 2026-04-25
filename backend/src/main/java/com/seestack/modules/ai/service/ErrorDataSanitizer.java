package com.seestack.modules.ai.service;

import org.jspecify.annotations.NullMarked;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Removes likely secrets before sending error data to an external LLM.
 * Heuristic-only: strips known sensitive keys and masks obvious token-shaped values.
 */
@Component
@NullMarked
public class ErrorDataSanitizer {

    private static final Set<String> BLOCKED_KEYS = Set.of(
            "password", "passwd", "pwd", "token", "access_token", "refresh_token",
            "api_key", "apikey", "secret", "authorization", "auth", "cookie",
            "session", "session_id", "x-api-key", "x-auth-token",
            "private_key", "client_secret"
    );

    private static final List<Pattern> VALUE_PATTERNS = List.of(
            Pattern.compile("(?i)bearer\\s+[a-z0-9._\\-]+"),
            Pattern.compile("sk-[a-zA-Z0-9_\\-]{20,}"),
            Pattern.compile("eyJ[a-zA-Z0-9_\\-]{10,}\\.[a-zA-Z0-9_\\-]{10,}\\.[a-zA-Z0-9_\\-]+"),
            Pattern.compile("[a-f0-9]{40,}")
    );

    public String scrubString(String input) {
        if (input == null || input.isEmpty()) return input;
        String out = input;
        for (Pattern p : VALUE_PATTERNS) {
            out = p.matcher(out).replaceAll("[REDACTED]");
        }
        return out;
    }

    public Map<String, Object> scrubMetadata(Map<String, Object> metadata) {
        if (metadata == null) return Map.of();
        Map<String, Object> copy = new HashMap<>();
        for (Map.Entry<String, Object> e : metadata.entrySet()) {
            String key = e.getKey();
            if (key == null) continue;
            if (BLOCKED_KEYS.contains(key.toLowerCase())) {
                copy.put(key, "[REDACTED]");
                continue;
            }
            Object val = e.getValue();
            if (val instanceof String s) {
                copy.put(key, scrubString(s));
            } else if (val instanceof Map<?, ?> m) {
                @SuppressWarnings("unchecked")
                Map<String, Object> nested = (Map<String, Object>) m;
                copy.put(key, scrubMetadata(nested));
            } else {
                copy.put(key, val);
            }
        }
        return copy;
    }
}
