package com.erp.backend.repository.inventory;

import org.springframework.data.jpa.repository.JpaRepository;
import com.erp.backend.entity.inventory.PurchaseRequest;

public interface PurchaseRequestRepository extends JpaRepository<PurchaseRequest, Long> {
}
