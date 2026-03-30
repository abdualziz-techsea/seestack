package com.allstak.modules.billing.entity;

import jakarta.persistence.*;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "subscriptions")
@NullMarked
public class SubscriptionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "org_id", nullable = false)
    private UUID orgId;

    @Column(nullable = false, length = 50)
    private String plan = "free";

    @Column(nullable = false, length = 50)
    private String status = "active";

    @Nullable
    @Column(name = "moyasar_invoice_id")
    private String moyasarInvoiceId;

    @Nullable
    @Column(name = "current_period_start")
    private Instant currentPeriodStart;

    @Nullable
    @Column(name = "current_period_end")
    private Instant currentPeriodEnd;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected SubscriptionEntity() {}

    public SubscriptionEntity(UUID orgId, String plan) {
        this.orgId = orgId;
        this.plan = plan;
    }

    public UUID getId() { return id; }
    public UUID getOrgId() { return orgId; }
    public String getPlan() { return plan; }
    public String getStatus() { return status; }
    public @Nullable String getMoyasarInvoiceId() { return moyasarInvoiceId; }
    public @Nullable Instant getCurrentPeriodStart() { return currentPeriodStart; }
    public @Nullable Instant getCurrentPeriodEnd() { return currentPeriodEnd; }
    public Instant getCreatedAt() { return createdAt; }

    public void upgrade(String plan, @Nullable String moyasarInvoiceId) {
        this.plan = plan;
        this.moyasarInvoiceId = moyasarInvoiceId;
        this.currentPeriodStart = Instant.now();
        this.currentPeriodEnd = Instant.now().plusSeconds(30L * 24 * 60 * 60);
    }
}
