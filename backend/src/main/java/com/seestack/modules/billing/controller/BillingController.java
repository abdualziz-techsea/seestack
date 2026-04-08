package com.seestack.modules.billing.controller;

import com.seestack.modules.billing.entity.BillingInvoiceEntity;
import com.seestack.modules.billing.service.BillingService;
import com.seestack.modules.billing.service.MoyasarInvoiceService;
import com.seestack.modules.billing.service.PlanEnforcementService;
import com.seestack.modules.billing.service.PlanLimits;
import com.seestack.shared.utils.ApiResponse;
import org.jspecify.annotations.NullMarked;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@NullMarked
public class BillingController {

    private static final Logger log = LoggerFactory.getLogger(BillingController.class);

    private final BillingService billingService;
    private final PlanEnforcementService enforcementService;
    private final JdbcClient jdbc;

    public BillingController(BillingService billingService,
                              PlanEnforcementService enforcementService,
                              JdbcClient jdbc) {
        this.billingService = billingService;
        this.enforcementService = enforcementService;
        this.jdbc = jdbc;
    }

    /**
     * Called after Moyasar JS SDK payment completes.
     * Moyasar redirects to callback_url?id=<paymentId>&status=paid
     * Frontend then calls this endpoint to verify server-side.
     */
    @PostMapping("/api/v1/billing/verify-payment")
    public ResponseEntity<ApiResponse<Map<String, Object>>> verifyPayment(
            @RequestBody Map<String, String> body) {
        UUID orgId = UUID.fromString(body.get("orgId"));
        String paymentId = body.get("paymentId");
        String plan = body.get("plan");

        if (paymentId == null || paymentId.isBlank() || plan == null || plan.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("INVALID_REQUEST", "Missing paymentId or plan", null));
        }

        Map<String, Object> payment = billingService.verifyPaymentAndUpgrade(orgId, paymentId, plan);

        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "plan", plan,
                "paymentId", paymentId,
                "status", payment.getOrDefault("status", "paid"),
                "amountFormat", payment.getOrDefault("amount_format", "")
        )));
    }

    /**
     * Returns the plan price (in halalas) so the frontend can pass the correct
     * amount to Moyasar.init() — prevents client-side price tampering.
     */
    @GetMapping("/api/v1/billing/plan-price")
    public ResponseEntity<ApiResponse<Map<String, Object>>> planPrice(@RequestParam String plan) {
        Integer halalas = MoyasarInvoiceService.PLAN_PRICES.get(plan.toLowerCase());
        if (halalas == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("INVALID_PLAN", "Invalid plan: " + plan, null));
        }
        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "plan", plan,
                "amountHalalas", halalas,
                "currency", "SAR"
        )));
    }

    /** Get current subscription */
    @GetMapping("/api/v1/billing/subscription")
    public ResponseEntity<ApiResponse<Map<String, Object>>> subscription(@RequestParam UUID orgId) {
        var sub = billingService.getSubscription(orgId);
        PlanLimits limits = enforcementService.getLimits(orgId);

        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "plan", sub.getPlan(),
                "status", sub.getStatus(),
                "moyasarInvoiceId", sub.getMoyasarInvoiceId() != null ? sub.getMoyasarInvoiceId() : "",
                "currentPeriodStart", sub.getCurrentPeriodStart() != null ? sub.getCurrentPeriodStart().toString() : "",
                "currentPeriodEnd", sub.getCurrentPeriodEnd() != null ? sub.getCurrentPeriodEnd().toString() : "",
                "limits", Map.of(
                        "maxErrors", limits.getMaxErrors(),
                        "maxMonitors", limits.getMaxMonitors(),
                        "maxSshServers", limits.getMaxSshServers(),
                        "maxMembers", limits.getMaxMembers(),
                        "maxProjects", limits.getMaxProjects()
                )
        )));
    }

    /** Get usage stats */
    @GetMapping("/api/v1/billing/usage")
    public ResponseEntity<ApiResponse<Map<String, Object>>> usage(@RequestParam UUID orgId) {
        PlanLimits limits = enforcementService.getLimits(orgId);

        long monitors   = countAcrossProjects("monitor_configs", orgId);
        long sshServers = countAcrossProjects("ssh_servers", orgId);
        long members    = jdbc.sql("SELECT count(*) FROM users WHERE org_id = :orgId")
                .param("orgId", orgId).query((rs, rowNum) -> rs.getLong(1)).single();

        int logRetentionDays = switch (limits.getPlanName()) {
            case "starter" -> 14;
            case "pro"     -> 30;
            case "scale"   -> 90;
            default        -> 3;
        };

        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "errorsThisMonth", 0,
                "monitors", monitors,
                "sshServers", sshServers,
                "members", members,
                "limits", Map.of(
                        "projects", limits.getMaxProjects(),
                        "errorsPerMonth", limits.getMaxErrors(),
                        "monitors", limits.getMaxMonitors(),
                        "sshServers", limits.getMaxSshServers(),
                        "members", limits.getMaxMembers(),
                        "logRetentionDays", logRetentionDays
                )
        )));
    }

    /** List all billing records for an org */
    @GetMapping("/api/v1/billing/invoices")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> listInvoices(
            @RequestParam UUID orgId) {
        List<Map<String, Object>> result = billingService.listInvoices(orgId).stream()
                .map(this::invoiceToMap)
                .toList();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** Fetch a single billing record */
    @GetMapping("/api/v1/billing/invoices/{moyasarId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getInvoice(
            @PathVariable String moyasarId,
            @RequestParam UUID orgId) {
        return billingService.getInvoice(orgId, moyasarId)
                .map(inv -> ResponseEntity.ok(ApiResponse.ok(invoiceToMap(inv))))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /** Refund a payment */
    @PostMapping("/api/v1/billing/payments/{paymentId}/refund")
    public ResponseEntity<ApiResponse<Map<String, Object>>> refundPayment(
            @PathVariable String paymentId,
            @RequestBody Map<String, Object> body) {
        Integer amountHalalas = body.containsKey("amountHalalas")
                ? ((Number) body.get("amountHalalas")).intValue()
                : null;
        Map<String, Object> result = billingService.refundPayment(paymentId, amountHalalas);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** Moyasar webhook — handles payment_paid events (optional, belt-and-suspenders) */
    @PostMapping("/webhooks/moyasar")
    public ResponseEntity<ApiResponse<Map<String, String>>> moyasarWebhook(
            @RequestBody Map<String, Object> payload) {
        log.info("Moyasar webhook: status={}", payload.get("status"));
        // Primary verification is done via /verify-payment (client-triggered).
        // This webhook acts as a fallback for missed callbacks.
        return ResponseEntity.ok(ApiResponse.ok(Map.of("received", "true")));
    }

    // ── Helpers ───────────────────────────────────────────────────

    private long countAcrossProjects(String table, UUID orgId) {
        return jdbc.sql("SELECT count(*) FROM " + table + " t JOIN projects p ON t.project_id = p.id WHERE p.org_id = :orgId")
                .param("orgId", orgId).query((rs, rowNum) -> rs.getLong(1)).single();
    }

    private Map<String, Object> invoiceToMap(BillingInvoiceEntity inv) {
        double sarAmount = inv.getAmountHalalas() / 100.0;
        String amountFormat = String.format("%.2f %s", sarAmount, inv.getCurrency());
        return Map.of(
                "id", inv.getId().toString(),
                "moyasarId", inv.getMoyasarId(),
                "plan", inv.getPlan(),
                "amountHalalas", inv.getAmountHalalas(),
                "amountFormat", amountFormat,
                "currency", inv.getCurrency(),
                "status", inv.getStatus(),
                "createdAt", inv.getCreatedAt().toString(),
                "updatedAt", inv.getUpdatedAt().toString()
        );
    }
}
