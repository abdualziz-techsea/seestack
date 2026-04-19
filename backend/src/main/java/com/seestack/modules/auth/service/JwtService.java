package com.seestack.modules.auth.service;

import org.jspecify.annotations.NullMarked;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Minimal HS256 JWT issuer/validator. No third-party dependency.
 * Token payload: {sub:<userId>, email:<email>, orgId:<orgId|null>, exp:<epochSec>}.
 */
@Service
@NullMarked
public class JwtService {

    private static final long TTL_SECONDS = 60L * 60 * 24 * 7; // 7 days

    private final byte[] secret;
    private final com.fasterxml.jackson.databind.ObjectMapper mapper =
            new com.fasterxml.jackson.databind.ObjectMapper();

    public JwtService(@Value("${seestack.jwt.secret}") String secret) {
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
    }

    public String issue(UUID userId, String email) {
        long exp = Instant.now().getEpochSecond() + TTL_SECONDS;
        Map<String, Object> header = Map.of("alg", "HS256", "typ", "JWT");
        Map<String, Object> payload = new HashMap<>();
        payload.put("sub", userId.toString());
        payload.put("email", email);
        payload.put("exp", exp);
        String h = b64url(writeJson(header));
        String p = b64url(writeJson(payload));
        String signingInput = h + "." + p;
        String s = b64url(hmacSha256(signingInput));
        return signingInput + "." + s;
    }

    /** Returns validated claims, or null if invalid/expired. */
    public Map<String, Object> parse(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) return null;
            String signingInput = parts[0] + "." + parts[1];
            String expected = b64url(hmacSha256(signingInput));
            if (!constantTimeEquals(expected, parts[2])) return null;
            byte[] payload = Base64.getUrlDecoder().decode(parts[1]);
            @SuppressWarnings("unchecked")
            Map<String, Object> claims = mapper.readValue(payload, Map.class);
            Object exp = claims.get("exp");
            if (exp instanceof Number n && n.longValue() < Instant.now().getEpochSecond()) return null;
            return claims;
        } catch (Exception e) {
            return null;
        }
    }

    private byte[] writeJson(Object obj) {
        try {
            return mapper.writeValueAsBytes(obj);
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    private byte[] hmacSha256(String input) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret, "HmacSHA256"));
            return mac.doFinal(input.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    private static String b64url(byte[] bytes) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static boolean constantTimeEquals(String a, String b) {
        if (a.length() != b.length()) return false;
        int r = 0;
        for (int i = 0; i < a.length(); i++) r |= a.charAt(i) ^ b.charAt(i);
        return r == 0;
    }
}
