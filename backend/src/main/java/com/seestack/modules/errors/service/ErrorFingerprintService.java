package com.seestack.modules.errors.service;

import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Generates a stable fingerprint for an error event.
 *
 * Algorithm:
 *   1. Start with the exception class name.
 *   2. Take the top {@value #TOP_FRAMES} meaningful frames (skip JDK/Spring internals).
 *   3. SHA-256 hash the concatenated string → 64-char hex.
 *
 * The same fingerprint algorithm must be used by all SeeStack SDKs.
 */
@Service
@NullMarked
public class ErrorFingerprintService {

    static final int TOP_FRAMES = 5;

    private static final String[] SKIP_PREFIXES = {
            "java.", "javax.", "jakarta.", "sun.", "com.sun.",
            "org.springframework.", "org.apache.", "io.netty."
    };

    /**
     * Generates a fingerprint from exception class and stack frame list.
     *
     * @param exceptionClass the exception class name (e.g. "java.lang.NullPointerException")
     * @param stackFrames    ordered list of stack frame strings, may be null or empty
     * @return 64-character lowercase hex SHA-256 fingerprint
     */
    public String generate(String exceptionClass, @Nullable List<String> stackFrames) {
        String input = buildInput(exceptionClass, stackFrames);
        return sha256Hex(input);
    }

    String buildInput(String exceptionClass, @Nullable List<String> stackFrames) {
        if (stackFrames == null || stackFrames.isEmpty()) {
            return exceptionClass.strip();
        }

        String frames = stackFrames.stream()
                .map(String::strip)
                .filter(frame -> !isInternalFrame(frame))
                .limit(TOP_FRAMES)
                .collect(Collectors.joining("|"));

        return frames.isEmpty()
                ? exceptionClass.strip()
                : exceptionClass.strip() + "|" + frames;
    }

    private boolean isInternalFrame(String frame) {
        for (String prefix : SKIP_PREFIXES) {
            if (frame.startsWith(prefix)) return true;
        }
        return false;
    }

    private String sha256Hex(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
