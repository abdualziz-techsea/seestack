package com.seestack.modules.ai.service;

import org.junit.jupiter.api.Test;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class ErrorDataSanitizerTest {

    private final ErrorDataSanitizer sanitizer = new ErrorDataSanitizer();

    @Test
    void scrubString_redactsBearerTokens() {
        String input = "Authorization: Bearer abcdef.12345";
        assertThat(sanitizer.scrubString(input)).contains("[REDACTED]");
        assertThat(sanitizer.scrubString(input)).doesNotContain("abcdef.12345");
    }

    @Test
    void scrubString_redactsOpenAiStyleKeys() {
        String input = "Loaded sk-1234567890abcdefghij1234567890";
        assertThat(sanitizer.scrubString(input)).contains("[REDACTED]");
    }

    @Test
    void scrubString_redactsLongHex() {
        String input = "etag=" + "0123456789abcdef0123456789abcdef0123456789";
        assertThat(sanitizer.scrubString(input)).contains("[REDACTED]");
    }

    @Test
    void scrubMetadata_redactsKnownSecretKeys() {
        Map<String, Object> meta = new LinkedHashMap<>();
        meta.put("password", "hunter2");
        meta.put("token", "abc");
        meta.put("authorization", "Bearer x");
        meta.put("path", "/api/checkout");
        Map<String, Object> out = sanitizer.scrubMetadata(meta);

        assertThat(out.get("password")).isEqualTo("[REDACTED]");
        assertThat(out.get("token")).isEqualTo("[REDACTED]");
        assertThat(out.get("authorization")).isEqualTo("[REDACTED]");
        assertThat(out.get("path")).isEqualTo("/api/checkout");
    }

    @Test
    void scrubMetadata_recursesNestedMaps() {
        Map<String, Object> nested = new LinkedHashMap<>();
        nested.put("api_key", "secret");
        nested.put("ok", "fine");
        Map<String, Object> meta = new LinkedHashMap<>();
        meta.put("ctx", nested);
        @SuppressWarnings("unchecked")
        Map<String, Object> out = (Map<String, Object>) sanitizer.scrubMetadata(meta).get("ctx");
        assertThat(out.get("api_key")).isEqualTo("[REDACTED]");
        assertThat(out.get("ok")).isEqualTo("fine");
    }
}
