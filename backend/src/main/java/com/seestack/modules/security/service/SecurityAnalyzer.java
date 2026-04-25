package com.seestack.modules.security.service;

import org.jspecify.annotations.NullMarked;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;

/**
 * Lightweight intelligent analysis on top of a port scan.
 *
 * Uses ONLY java.net.http.HttpClient (no external tools).
 *  - service labels for known ports
 *  - one HTTP/HTTPS HEAD/GET probe per detected web port
 *  - presence check for a small set of common security headers
 *  - simple, transparent risk score
 *
 * Educational, not a vulnerability scanner.
 */
@Component
@NullMarked
public class SecurityAnalyzer {

    public static final List<String> CHECKED_HEADERS = List.of(
            "Strict-Transport-Security",
            "Content-Security-Policy",
            "X-Frame-Options",
            "X-Content-Type-Options"
    );

    private static final Map<Integer, String> SERVICE_MAP = Map.of(
            22, "SSH",
            80, "HTTP",
            443, "HTTPS",
            3306, "MySQL",
            5432, "PostgreSQL",
            6379, "Redis",
            8080, "HTTP",
            8443, "HTTPS"
    );

    private static final Set<Integer> DATABASE_PORTS = Set.of(3306, 5432, 6379);
    private static final Set<Integer> HTTP_PORTS = Set.of(80, 8080);
    private static final Set<Integer> HTTPS_PORTS = Set.of(443, 8443);

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(3))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();

    public Result analyze(String host, List<Integer> openPorts) {
        Map<String, String> services = new LinkedHashMap<>();
        for (int p : openPorts) {
            String label = SERVICE_MAP.get(p);
            if (label != null) services.put(String.valueOf(p), label);
        }

        // Pick one HTTP and one HTTPS port, if any, for inspection.
        Integer httpsPort = openPorts.stream().filter(HTTPS_PORTS::contains).findFirst().orElse(null);
        Integer httpPort  = openPorts.stream().filter(HTTP_PORTS::contains).findFirst().orElse(null);

        HttpProbe probe = null;
        Map<String, Boolean> headers = new LinkedHashMap<>();
        for (String h : CHECKED_HEADERS) headers.put(h, false);

        if (httpsPort != null) {
            probe = probeHttp("https://" + host + (httpsPort == 443 ? "" : ":" + httpsPort) + "/");
        } else if (httpPort != null) {
            probe = probeHttp("http://" + host + (httpPort == 80 ? "" : ":" + httpPort) + "/");
        }

        if (probe != null) {
            for (String h : CHECKED_HEADERS) {
                if (probe.headers.keySet().stream().anyMatch(k -> k.equalsIgnoreCase(h))) {
                    headers.put(h, true);
                }
            }
        }

        // Risk scoring
        int score = 0;
        List<String> warnings = new ArrayList<>();

        for (int p : openPorts) {
            if (DATABASE_PORTS.contains(p)) {
                score += 30;
                warnings.add("Database port " + p + " (" + SERVICE_MAP.get(p) + ") is publicly reachable");
            }
        }
        if (httpsPort == null && httpPort != null) {
            score += 15;
            warnings.add("HTTP is exposed without HTTPS");
        }
        if (probe != null) {
            long missing = headers.values().stream().filter(v -> !v).count();
            if (missing > 0) {
                score += (int) Math.min(20, missing * 5);
                warnings.add(missing + " of " + CHECKED_HEADERS.size() + " common security headers are missing");
            }
            if (probe.statusCode == 0) {
                score += 10;
                warnings.add("HTTP probe failed or timed out");
            }
        }
        score = Math.min(100, score);

        String riskLevel = score >= 60 ? "HIGH" : score >= 30 ? "MEDIUM" : "LOW";

        String summary = warnings.isEmpty()
                ? "No notable issues detected for the small set of checks performed."
                : String.join(". ", warnings) + ".";

        return new Result(services, probe, headers, warnings, score, riskLevel, summary);
    }

    private HttpProbe probeHttp(String url) {
        long start = System.nanoTime();
        try {
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(4))
                    .header("User-Agent", "seestack-security-analyzer/1.0")
                    .GET()
                    .build();
            HttpResponse<Void> resp = http.send(req, HttpResponse.BodyHandlers.discarding());
            int ms = (int) ((System.nanoTime() - start) / 1_000_000);
            Map<String, String> headers = new LinkedHashMap<>();
            resp.headers().map().forEach((k, v) -> {
                if (!v.isEmpty()) headers.put(k, v.get(0));
            });
            return new HttpProbe(url, resp.statusCode(), ms, headers);
        } catch (Exception e) {
            int ms = (int) ((System.nanoTime() - start) / 1_000_000);
            return new HttpProbe(url, 0, ms, Map.of());
        }
    }

    public record HttpProbe(String url, int statusCode, int responseTimeMs, Map<String, String> headers) {
        public String server() { return headerValue("server"); }
        public String contentType() { return headerValue("content-type"); }
        private String headerValue(String name) {
            return headers.entrySet().stream()
                    .filter(e -> e.getKey().equalsIgnoreCase(name))
                    .map(Map.Entry::getValue).findFirst().orElse("");
        }
    }

    public record Result(
            Map<String, String> detectedServices,
            HttpProbe httpProbe,
            Map<String, Boolean> securityHeaders,
            List<String> warnings,
            int riskScore,
            String riskLevel,
            String summary
    ) {}
}
