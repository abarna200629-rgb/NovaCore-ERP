package com.erp.backend.repository.performance;

import org.springframework.data.jpa.repository.JpaRepository;

import com.erp.backend.entity.performance.EmployeePerformance;

import java.util.Optional;
import java.util.List;

public interface EmployeePerformanceRepository
extends JpaRepository<EmployeePerformance, Long> {
    Optional<EmployeePerformance> findByEmployeeIdAndMonthName(Long employeeId, String monthName);
    List<EmployeePerformance> findByEmployeeId(Long employeeId);
}