package com.allstak.modules.teams.service;

import org.jspecify.annotations.NullMarked;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.HexFormat;

/**
 * Generates API keys with environment-specific prefixes.
 * Production: ask_live_{32 random alphanumeric}
 * Test:       ask_test_{32 random alphanumeric}
 */
@Service
@NullMarked
public class ApiKeyGeneratorService {

    private static final String CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";
    private static final int RANDOM_LENGTH = 32;
    private static final SecureRandom RANDOM = new SecureRandom();

    public String generateKey(String environment) {
        String prefix = "test".equalsIgnoreCase(environment) ? "ask_test_" : "ask_live_";
        StringBuilder sb = new StringBuilder(prefix);
        for (int i = 0; i < RANDOM_LENGTH; i++) {
            sb.append(CHARS.charAt(RANDOM.nextInt(CHARS.length())));
        }
        return sb.toString();
    }

    public String hashKey(String rawKey) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawKey.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

    public String extractPrefix(String rawKey) {
        return rawKey.length() > 8 ? rawKey.substring(0, 8) : rawKey;
    }
}
