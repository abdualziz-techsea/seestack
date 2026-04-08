package com.seestack.modules.billing.service;

import com.seestack.modules.billing.entity.BillingInvoiceEntity;
import com.seestack.modules.billing.repository.BillingInvoiceRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Real Moyasar Payments API integration.
 *
 * Payment flow (JS SDK):
 *   1. Frontend embeds Moyasar.init() with publishable key — card form shown in modal
 *   2. User submits card — Moyasar creates the payment from the browser
 *   3. Moyasar redirects to callback_url?id=<paymentId>&status=paid
 *   4. Frontend calls our backend: POST /api/v1/billing/verify-payment
 *   5. This service fetches GET /payments/:id using the secret key, validates amount + status
 *   6. If valid → subscription upgraded, billing record stored
 *
 * Base URL : https://api.moyasar.com/v1
 * Auth     : HTTP Basic — username=secretKey, password=empty
 */
@Service
@NullMarked
public class MoyasarInvoiceService {

    private static final Logger log = LoggerFactory.getLogger(MoyasarInvoiceService.class);
    private static final String MOYASAR_BASE = "https://api.moyasar.com/v1";

    /** Plan prices in halalas (100 halalas = 1 SAR). */
    public static final Map<String, Integer> PLAN_PRICES = Map.of(
            "starter", 1900,   // 19 SAR/month
            "pro",     4900,   // 49 SAR/month
            "scale",   9900    // 99 SAR/month
    );

    private final BillingInvoiceRepository invoiceRepository;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    @Value("${moyasar.secret-key:}")
    private String secretKey;

    public MoyasarInvoiceService(BillingInvoiceRepository invoiceRepository,
                                  ObjectMapper objectMapper) {
        this.invoiceRepository = invoiceRepository;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(15))
                .build();
    }

    /**
     * Fetches a payment from Moyasar by ID (secret key required — backend only).
     */
    public Map<String, Object> fetchPayment(String paymentId) {
        requireSecretKey();
        try {
            HttpResponse<String> response = httpClient.send(
                    authorizedGet(MOYASAR_BASE + "/payments/" + paymentId),
                    HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                throw new RuntimeException("Moyasar fetch payment failed (" + response.statusCode() + "): " + response.body());
            }
            return objectMapper.readValue(response.body(), new TypeReference<>() {});
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch Moyasar payment: " + e.getMessage(), e);
        }
    }

    /**
     * Fetches the payment from Moyasar and validates it is paid with the correct amount.
     * Pure HTTP — no DB writes. BillingService handles DB persistence separately.
     * Throws if the payment is invalid or amount doesn't match.
     */
    public Map<String, Object> fetchAndValidate(UUID orgId, String paymentId, String plan) {
        Integer expectedHalalas = PLAN_PRICES.get(plan.toLowerCase());
        if (expectedHalalas == null) {
            throw new IllegalArgumentException("Invalid plan: " + plan);
        }

        Map<String, Object> payment = fetchPayment(paymentId);

        String status = (String) payment.getOrDefault("status", "");
        if (!"paid".equals(status)) {
            throw new IllegalStateException("Payment status is '" + status + "', expected 'paid'");
        }

        int paidAmount = ((Number) payment.getOrDefault("amount", 0)).intValue();
        if (paidAmount != expectedHalalas) {
            log.error("Amount mismatch for payment {}: expected {} halalas but got {}",
                    paymentId, expectedHalalas, paidAmount);
            throw new IllegalStateException(
                    "Payment amount mismatch: expected " + expectedHalalas + " but got " + paidAmount);
        }

        log.info("Payment validated: org={} id={} plan={} amount={} halalas", orgId, paymentId, plan, paidAmount);
        return payment;
    }

    /**
     * Refunds a payment: POST /payments/:paymentId/refund
     * amountHalalas is optional — null means full refund.
     */
    public Map<String, Object> refundPayment(String paymentId, @Nullable Integer amountHalalas) {
        requireSecretKey();
        try {
            String bodyJson = amountHalalas != null
                    ? objectMapper.writeValueAsString(Map.of("amount", amountHalalas))
                    : "{}";

            String auth = authHeader();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(MOYASAR_BASE + "/payments/" + paymentId + "/refund"))
                    .header("Authorization", "Basic " + auth)
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(bodyJson))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            log.info("Moyasar refund payment={} status={}", paymentId, response.statusCode());

            if (response.statusCode() != 200) {
                throw new RuntimeException("Moyasar refund failed (" + response.statusCode() + "): " + response.body());
            }

            Map<String, Object> result = objectMapper.readValue(response.body(), new TypeReference<>() {});

            // Update billing record status
            invoiceRepository.findByMoyasarId(paymentId).ifPresent(inv -> {
                inv.updateStatus("refunded");
                invoiceRepository.save(inv);
            });

            return result;
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to refund Moyasar payment: " + e.getMessage(), e);
        }
    }

    /** Lists all billing records for an org (our DB). */
    public List<BillingInvoiceEntity> listByOrg(UUID orgId) {
        return invoiceRepository.findByOrgIdOrderByCreatedAtDesc(orgId);
    }

    // ── Internal helpers ──────────────────────────────────────────

    private HttpRequest authorizedGet(String url) {
        return HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Authorization", "Basic " + authHeader())
                .header("Accept", "application/json")
                .GET()
                .build();
    }

    private String authHeader() {
        return Base64.getEncoder().encodeToString((secretKey + ":").getBytes());
    }

    private void requireSecretKey() {
        if (secretKey == null || secretKey.isBlank()) {
            throw new IllegalStateException("Moyasar secret key not configured (MOYASER_SECRET_KEY)");
        }
    }
}
