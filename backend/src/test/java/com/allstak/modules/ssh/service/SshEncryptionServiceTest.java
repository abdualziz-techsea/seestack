package com.allstak.modules.ssh.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SshEncryptionServiceTest {

    private SshEncryptionService service;

    @BeforeEach
    void setUp() {
        // 32-char key for AES-256
        service = new SshEncryptionService("01234567890123456789012345678901");
    }

    @Test
    @DisplayName("Encrypt and decrypt round-trip produces original text")
    void encryptDecrypt_roundTrip() {
        String original = "-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQ...\n-----END RSA PRIVATE KEY-----";
        String encrypted = service.encrypt(original);
        String decrypted = service.decrypt(encrypted);
        assertThat(decrypted).isEqualTo(original);
    }

    @Test
    @DisplayName("Encrypted output is Base64 and different from plaintext")
    void encrypt_producesBase64() {
        String plaintext = "my-secret-key-content";
        String encrypted = service.encrypt(plaintext);
        assertThat(encrypted).isNotEqualTo(plaintext);
        assertThat(encrypted).matches("^[A-Za-z0-9+/=]+$");
    }

    @Test
    @DisplayName("Two encryptions of same text produce different ciphertexts (random IV)")
    void encrypt_differentCiphertexts() {
        String plaintext = "same-key-content";
        String encrypted1 = service.encrypt(plaintext);
        String encrypted2 = service.encrypt(plaintext);
        assertThat(encrypted1).isNotEqualTo(encrypted2);
    }

    @Test
    @DisplayName("Both different ciphertexts decrypt to same original")
    void decrypt_bothProduceSameOriginal() {
        String plaintext = "same-key-content";
        String encrypted1 = service.encrypt(plaintext);
        String encrypted2 = service.encrypt(plaintext);
        assertThat(service.decrypt(encrypted1)).isEqualTo(plaintext);
        assertThat(service.decrypt(encrypted2)).isEqualTo(plaintext);
    }

    @Test
    @DisplayName("Decrypting tampered ciphertext throws exception")
    void decrypt_tamperedCiphertext_throws() {
        String encrypted = service.encrypt("secret");
        String tampered = encrypted.substring(0, encrypted.length() - 4) + "XXXX";
        assertThatThrownBy(() -> service.decrypt(tampered))
                .isInstanceOf(RuntimeException.class);
    }

    @Test
    @DisplayName("Wrong key length throws on construction")
    void constructor_wrongKeyLength_throws() {
        assertThatThrownBy(() -> new SshEncryptionService("too-short"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("32 characters");
    }

    @Test
    @DisplayName("Empty string encrypts and decrypts correctly")
    void encryptDecrypt_emptyString() {
        String encrypted = service.encrypt("");
        assertThat(service.decrypt(encrypted)).isEmpty();
    }

    @Test
    @DisplayName("Large key content encrypts and decrypts correctly")
    void encryptDecrypt_largeContent() {
        String largeKey = "A".repeat(4096);
        String encrypted = service.encrypt(largeKey);
        assertThat(service.decrypt(encrypted)).isEqualTo(largeKey);
    }
}
