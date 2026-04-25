package com.seestack.modules.loadtest.service;

import org.jspecify.annotations.NullMarked;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.*;

/**
 * Basic Load Test runner.
 *
 *   - Fixed hard caps: 100 requests, 10 concurrency, 5 s per-request timeout
 *   - Uses only the JDK HttpClient
 *   - Counts success as any 2xx; everything else (including timeouts) is a failure
 *   - Sequential per worker; total parallelism never exceeds {@code concurrency}
 *
 * Educational use only — not a benchmarking or attack tool.
 */
@Component
@NullMarked
public class LoadTestRunner {

    private static final Logger log = LoggerFactory.getLogger(LoadTestRunner.class);

    public static final int MAX_REQUESTS = 100;
    public static final int MAX_CONCURRENCY = 10;
    private static final int REQUEST_TIMEOUT_SECONDS = 5;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(REQUEST_TIMEOUT_SECONDS))
            .followRedirects(HttpClient.Redirect.NEVER)
            .build();

    public Result run(String targetUrl, int requested, int concurrency) {
        int total = Math.min(Math.max(1, requested), MAX_REQUESTS);
        int workers = Math.min(Math.max(1, concurrency), MAX_CONCURRENCY);

        ExecutorService pool = Executors.newFixedThreadPool(workers);
        List<Future<Sample>> futures = new ArrayList<>(total);
        try {
            for (int i = 0; i < total; i++) {
                futures.add(pool.submit(() -> singleRequest(targetUrl)));
            }

            List<Sample> samples = new ArrayList<>(total);
            for (Future<Sample> f : futures) {
                try {
                    samples.add(f.get(REQUEST_TIMEOUT_SECONDS + 5, TimeUnit.SECONDS));
                } catch (Exception e) {
                    samples.add(Sample.failure(0));
                }
            }
            return summarize(samples);
        } finally {
            pool.shutdownNow();
        }
    }

    private Sample singleRequest(String targetUrl) {
        long start = System.nanoTime();
        try {
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(targetUrl))
                    .timeout(Duration.ofSeconds(REQUEST_TIMEOUT_SECONDS))
                    .header("User-Agent", "seestack-load-test/1.0")
                    .GET()
                    .build();
            HttpResponse<Void> resp = httpClient.send(req, HttpResponse.BodyHandlers.discarding());
            int ms = (int) ((System.nanoTime() - start) / 1_000_000);
            int code = resp.statusCode();
            return code >= 200 && code < 300 ? Sample.success(ms, code) : Sample.failure(ms, code);
        } catch (Exception e) {
            int ms = (int) ((System.nanoTime() - start) / 1_000_000);
            return Sample.failure(ms);
        }
    }

    private Result summarize(List<Sample> samples) {
        int total = samples.size();
        int success = 0;
        int failed = 0;
        long sum = 0;
        int min = Integer.MAX_VALUE;
        int max = 0;
        Map<String, Integer> dist = new LinkedHashMap<>();
        List<Integer> sortedTimes = new ArrayList<>(total);

        for (Sample s : samples) {
            if (s.success) success++; else failed++;
            sum += s.ms;
            if (s.ms < min) min = s.ms;
            if (s.ms > max) max = s.ms;
            sortedTimes.add(s.ms);
            String key = s.statusCode > 0 ? String.valueOf(s.statusCode) : "error";
            dist.merge(key, 1, Integer::sum);
        }
        if (total == 0) min = 0;
        Collections.sort(sortedTimes);
        int p95 = sortedTimes.isEmpty() ? 0
                : sortedTimes.get(Math.min(sortedTimes.size() - 1,
                        (int) Math.ceil(sortedTimes.size() * 0.95) - 1));
        double avg = total > 0 ? (sum * 1.0 / total) : 0;
        return new Result(total, success, failed, avg, min, max, p95, dist);
    }

    public record Result(
            int totalRequests,
            int successfulRequests,
            int failedRequests,
            double avgMs,
            int minMs,
            int maxMs,
            int p95Ms,
            Map<String, Integer> statusCodeDistribution
    ) {}

    private record Sample(boolean success, int ms, int statusCode) {
        static Sample success(int ms, int code) { return new Sample(true, ms, code); }
        static Sample failure(int ms, int code) { return new Sample(false, ms, code); }
        static Sample failure(int ms) { return new Sample(false, ms, 0); }
    }
}
