package com.allstak.modules.billing.repository;

import com.allstak.modules.billing.entity.BillingInvoiceEntity;
import org.jspecify.annotations.NullMarked;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@NullMarked
public interface BillingInvoiceRepository extends JpaRepository<BillingInvoiceEntity, UUID> {
    List<BillingInvoiceEntity> findByOrgIdOrderByCreatedAtDesc(UUID orgId);
    Optional<BillingInvoiceEntity> findByMoyasarId(String moyasarId);
}
