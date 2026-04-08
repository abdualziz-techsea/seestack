package com.seestack.modules.billing.entity;

import jakarta.persistence.*;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "billing_invoices")
@NullMarked
public class BillingInvoiceEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "org_id", nullable = false)
    private UUID orgId;

    @Column(name = "moyasar_id", nullable = false, unique = true)
    private String moyasarId;

    @Column(nullable = false, length = 50)
    private String plan;

    @Column(name = "amount_halalas", nullable = false)
    private int amountHalalas;

    @Column(nullable = false, length = 10)
    private String currency = "SAR";

    @Column(nullable = false, length = 50)
    private String status = "initiated";

    @Nullable
    @Column(name = "checkout_url", columnDefinition = "TEXT")
    private String checkoutUrl;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    protected BillingInvoiceEntity() {}

    public BillingInvoiceEntity(UUID orgId, String moyasarId, String plan, int amountHalalas,
                                 String currency, @Nullable String checkoutUrl) {
        this.orgId = orgId;
        this.moyasarId = moyasarId;
        this.plan = plan;
        this.amountHalalas = amountHalalas;
        this.currency = currency;
        this.checkoutUrl = checkoutUrl;
    }

    public UUID getId() { return id; }
    public UUID getOrgId() { return orgId; }
    public String getMoyasarId() { return moyasarId; }
    public String getPlan() { return plan; }
    public int getAmountHalalas() { return amountHalalas; }
    public String getCurrency() { return currency; }
    public String getStatus() { return status; }
    public @Nullable String getCheckoutUrl() { return checkoutUrl; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }

    public void updateStatus(String status) {
        this.status = status;
        this.updatedAt = Instant.now();
    }
}
