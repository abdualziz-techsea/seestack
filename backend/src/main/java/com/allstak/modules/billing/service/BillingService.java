package com.allstak.modules.billing.service;

import com.allstak.modules.billing.entity.BillingInvoiceEntity;
import com.allstak.modules.billing.entity.SubscriptionEntity;
import com.allstak.modules.billing.repository.BillingInvoiceRepository;
import com.allstak.modules.billing.repository.SubscriptionRepository;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@NullMarked
public class BillingService {

    private static final Logger log = LoggerFactory.getLogger(BillingService.class);

    private final SubscriptionRepository subscriptionRepository;
    private final BillingInvoiceRepository invoiceRepository;
    private final MoyasarInvoiceService moyasarService;

    public BillingService(SubscriptionRepository subscriptionRepository,
                           BillingInvoiceRepository invoiceRepository,
                           MoyasarInvoiceService moyasarService) {
        this.subscriptionRepository = subscriptionRepository;
        this.invoiceRepository = invoiceRepository;
        this.moyasarService = moyasarService;
    }

    /** Returns subscription for the org, creating a free one if none exists. */
    @Transactional
    public SubscriptionEntity getSubscription(UUID orgId) {
        return subscriptionRepository.findByOrgId(orgId)
                .orElseGet(() -> {
                    log.info("Creating default free subscription for org {}", orgId);
                    return subscriptionRepository.save(new SubscriptionEntity(orgId, "free"));
                });
    }

    /**
     * Verifies a Moyasar payment (via secret key, server-side) then upgrades the subscription.
     *
     * HTTP call is intentionally done BEFORE the DB transaction so we don't hold
     * a connection/lock while waiting for the Moyasar API response.
     */
    public Map<String, Object> verifyPaymentAndUpgrade(UUID orgId, String paymentId, String plan) {
        // 1. Fetch & validate with Moyasar — no DB transaction held here
        Map<String, Object> payment = moyasarService.fetchAndValidate(orgId, paymentId, plan);

        // 2. Persist billing record + upgrade subscription in one transaction
        persistVerifiedPayment(orgId, paymentId, plan, payment);

        return payment;
    }

    @Transactional
    protected void persistVerifiedPayment(UUID orgId, String paymentId, String plan,
                                           Map<String, Object> payment) {
        // Idempotent billing record — safe to call multiple times for the same paymentId
        if (invoiceRepository.findByMoyasarId(paymentId).isEmpty()) {
            int amount = ((Number) payment.getOrDefault("amount", 0)).intValue();
            String currency = (String) payment.getOrDefault("currency", "SAR");
            BillingInvoiceEntity record = new BillingInvoiceEntity(
                    orgId, paymentId, plan, amount, currency, null);
            record.updateStatus("paid");
            invoiceRepository.save(record);
            log.info("Billing record saved: org={} payment={} plan={}", orgId, paymentId, plan);
        }

        // Upgrade subscription
        SubscriptionEntity sub = subscriptionRepository.findByOrgId(orgId)
                .orElseGet(() -> new SubscriptionEntity(orgId, "free"));
        sub.upgrade(plan, paymentId);
        subscriptionRepository.save(sub);
        log.info("Subscription upgraded: org={} plan={}", orgId, plan);
    }

    public List<BillingInvoiceEntity> listInvoices(UUID orgId) {
        return moyasarService.listByOrg(orgId);
    }

    public Optional<BillingInvoiceEntity> getInvoice(UUID orgId, String moyasarId) {
        return invoiceRepository.findByMoyasarId(moyasarId)
                .filter(inv -> inv.getOrgId().equals(orgId));
    }

    public Map<String, Object> refundPayment(String paymentId, @Nullable Integer amountHalalas) {
        return moyasarService.refundPayment(paymentId, amountHalalas);
    }
}
