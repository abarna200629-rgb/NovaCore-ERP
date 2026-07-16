package com.erp.backend.repository.sales;

import org.springframework.data.jpa.repository.JpaRepository;
import com.erp.backend.entity.sales.CRMLead;

public interface CRMLeadRepository extends JpaRepository<CRMLead, Long> {
}
