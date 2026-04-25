package com.seestack.modules.security.service;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class SecurityAnalyzerTest {

    private final SecurityAnalyzer analyzer = new SecurityAnalyzer();

    @Test
    void detectsKnownServicesByPort() {
        // Use a host that won't actually have these services exposed on the test machine —
        // but service detection is purely a port-to-label map and runs even if probes fail.
        var result = analyzer.analyze("127.0.0.1", List.of(22, 5432, 6379));
        assertThat(result.detectedServices()).containsEntry("22", "SSH");
        assertThat(result.detectedServices()).containsEntry("5432", "PostgreSQL");
        assertThat(result.detectedServices()).containsEntry("6379", "Redis");
    }

    @Test
    void riskScore_rewardsExposedDatabasePorts() {
        var result = analyzer.analyze("127.0.0.1", List.of(5432));
        assertThat(result.riskScore()).isGreaterThanOrEqualTo(30);
        assertThat(result.warnings()).anyMatch(w -> w.contains("Database port"));
    }

    @Test
    void riskScore_addsHttpWithoutHttpsPenalty() {
        var noHttps = analyzer.analyze("127.0.0.1", List.of(80));
        assertThat(noHttps.warnings()).anyMatch(w -> w.contains("HTTP is exposed without HTTPS"));
    }

    @Test
    void riskLevel_isCappedAtHundred() {
        var result = analyzer.analyze("127.0.0.1", List.of(80, 3306, 5432, 6379));
        assertThat(result.riskScore()).isLessThanOrEqualTo(100);
        assertThat(List.of("LOW", "MEDIUM", "HIGH")).contains(result.riskLevel());
    }

    @Test
    void noOpenPorts_isLowRiskWithEmptyWarnings() {
        var result = analyzer.analyze("127.0.0.1", List.of());
        assertThat(result.detectedServices()).isEmpty();
        assertThat(result.riskScore()).isEqualTo(0);
        assertThat(result.riskLevel()).isEqualTo("LOW");
    }
}
