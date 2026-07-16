package com.erp.backend.repository.hr;

import org.springframework.data.jpa.repository.JpaRepository;
import com.erp.backend.entity.hr.Payroll;

public interface PayrollRepository
        extends JpaRepository<Payroll, Long> {
}