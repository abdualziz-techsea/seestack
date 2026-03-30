package com.allstak.modules.replay.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class InputMaskingServiceTest {

    private InputMaskingService service;

    @BeforeEach
    void setUp() {
        service = new InputMaskingService();
    }

    @Test
    @DisplayName("Masks password field values")
    void mask_passwordField() {
        String input = "{\"type\":\"password\",\"value\":\"mySecret123\"}";
        String result = service.mask(input);
        assertThat(result).contains("***REDACTED***");
        assertThat(result).doesNotContain("mySecret123");
    }

    @Test
    @DisplayName("Masks credit card numbers preserving last 4 digits")
    void mask_creditCard() {
        String input = "{\"value\":\"4111 1111 1111 1234\"}";
        String result = service.mask(input);
        assertThat(result).contains("****-****-****-1234");
        assertThat(result).doesNotContain("4111");
    }

    @Test
    @DisplayName("Masks credit card without spaces")
    void mask_creditCardNoSpaces() {
        String input = "{\"value\":\"4111111111111234\"}";
        String result = service.mask(input);
        assertThat(result).contains("****-****-****-1234");
    }

    @Test
    @DisplayName("Masks sensitive JSON fields (secret, token, ssn)")
    void mask_sensitiveFields() {
        String input = "{\"secret\":\"abc123\",\"token\":\"xyz789\"}";
        String result = service.mask(input);
        assertThat(result).doesNotContain("abc123");
        assertThat(result).doesNotContain("xyz789");
        assertThat(result).contains("***REDACTED***");
    }

    @Test
    @DisplayName("Does not mask non-sensitive data")
    void mask_nonSensitiveUnchanged() {
        String input = "{\"type\":\"click\",\"target\":\"#submit-btn\",\"x\":100,\"y\":200}";
        String result = service.mask(input);
        assertThat(result).isEqualTo(input);
    }

    @Test
    @DisplayName("containsSensitiveData detects password fields")
    void containsSensitive_password() {
        assertThat(service.containsSensitiveData("{\"type\":\"password\",\"value\":\"x\"}")).isTrue();
    }

    @Test
    @DisplayName("containsSensitiveData returns false for normal data")
    void containsSensitive_normal() {
        assertThat(service.containsSensitiveData("{\"type\":\"click\"}")).isFalse();
    }

    @Test
    @DisplayName("Empty string returns empty")
    void mask_emptyString() {
        assertThat(service.mask("")).isEmpty();
    }
}
