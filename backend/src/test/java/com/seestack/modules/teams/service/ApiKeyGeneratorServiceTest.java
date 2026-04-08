package com.seestack.modules.teams.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ApiKeyGeneratorServiceTest {

    private ApiKeyGeneratorService service;

    @BeforeEach
    void setUp() {
        service = new ApiKeyGeneratorService();
    }

    @Test
    @DisplayName("Production key has ask_live_ prefix")
    void productionKey_prefix() {
        String key = service.generateKey("production");
        assertThat(key).startsWith("ask_live_");
    }

    @Test
    @DisplayName("Test key has ask_test_ prefix")
    void testKey_prefix() {
        String key = service.generateKey("test");
        assertThat(key).startsWith("ask_test_");
    }

    @Test
    @DisplayName("Key has correct total length (prefix + 32 random)")
    void keyLength() {
        String key = service.generateKey("production");
        assertThat(key).hasSize("ask_live_".length() + 32);
    }

    @Test
    @DisplayName("Hash is deterministic")
    void hashDeterministic() {
        String hash1 = service.hashKey("test-key");
        String hash2 = service.hashKey("test-key");
        assertThat(hash1).isEqualTo(hash2);
    }

    @Test
    @DisplayName("Two generated keys are unique")
    void keysUnique() {
        String key1 = service.generateKey("production");
        String key2 = service.generateKey("production");
        assertThat(key1).isNotEqualTo(key2);
    }

    @Test
    @DisplayName("extractPrefix returns first 8 chars")
    void extractPrefix() {
        assertThat(service.extractPrefix("ask_live_abcdefgh12345")).isEqualTo("ask_live");
    }

    @Test
    @DisplayName("Hash is 64 hex chars (SHA-256)")
    void hashFormat() {
        String hash = service.hashKey("any-key");
        assertThat(hash).hasSize(64).matches("[0-9a-f]+");
    }
}
