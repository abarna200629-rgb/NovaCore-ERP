package com.erp.backend.service.sales;

import java.time.LocalDate;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.erp.backend.entity.Employee;
import com.erp.backend.entity.inventory.Product;
import com.erp.backend.entity.sales.SalesTarget;
import com.erp.backend.repository.EmployeeRepository;
import com.erp.backend.repository.inventory.ProductRepository;
import com.erp.backend.repository.sales.SalesTargetRepository;
import com.erp.backend.service.performance.EmployeePerformanceService;
import com.erp.backend.exception.DuplicateRecordException;

@Service
public class SalesTargetService {

    @Autowired
    private SalesTargetRepository repository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private EmployeePerformanceService performanceService;

    // ===========================
    // CREATE TARGET
    // ===========================

    public SalesTarget saveTarget(SalesTarget target) {
        if (target.getMonthName() == null && target.getDeadline() != null) {
            String name = target.getDeadline().getMonth().toString();
            target.setMonthName(name.substring(0, 1).toUpperCase() + name.substring(1).toLowerCase());
        }

        // 1. Negative targets validation
        if (target.getTargetQuantity() == null || target.getTargetQuantity() < 0) {
            throw new IllegalArgumentException("Target quantity cannot be negative");
        }

        // 2. Duplicate check
        java.util.Optional<SalesTarget> existing = repository.findByEmployeeIdAndProductIdAndMonthName(
                target.getEmployeeId(), target.getProductId(), target.getMonthName()
        );
        if (existing.isPresent()) {
            throw new DuplicateRecordException("A target already exists for this employee, product, and month");
        }

        Employee employee = employeeRepository.findById(target.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee Not Found"));

        if (!"ACTIVE".equalsIgnoreCase(employee.getStatus())) {
            throw new RuntimeException("Sales Target Error: Inactive employees cannot receive sales targets!");
        }

        Product product = productRepository.findById(target.getProductId())
                .orElseThrow(() -> new RuntimeException("Product Not Found"));

        target.setEmployeeName(employee.getName());
        target.setProductName(product.getProductName());

        if (target.getAchievedQuantity() == null) {
            target.setAchievedQuantity(0);
        }

        calculatePerformance(target);
        SalesTarget saved = repository.save(target);

        // Live Synchronization
        performanceService.recalculateAll();
        return saved;
    }

    // ===========================
    // GET ALL TARGETS
    // ===========================

    public List<SalesTarget> getAllTargets() {
        performanceService.recalculateAll();
        return repository.findAll();
    }

    // ===========================
    // CALCULATE PERFORMANCE
    // ===========================

    public void calculatePerformance(SalesTarget target) {
        int targetQty = target.getTargetQuantity() != null ? target.getTargetQuantity() : 1;
        if (targetQty <= 0) targetQty = 1;
        int achievedQty = target.getAchievedQuantity() != null ? target.getAchievedQuantity() : 0;

        // Actual %
        double actualPercentage = (achievedQty * 100.0) / targetQty;
        target.setAchievementPercentage(actualPercentage);

        // Extra Sales
        int extraSales = Math.max(0, achievedQty - targetQty);
        target.setExtraSales(extraSales);

        // Over Achievement
        double overAchievement = Math.max(0, actualPercentage - 100.0);
        target.setOverAchievementPercentage(overAchievement);

        // Rating & Status
        if (actualPercentage >= 100) {
            target.setRating("EXCELLENT");
            target.setCompletionStatus("COMPLETED");
            target.setCompletedDate(LocalDate.now());
        } else if (actualPercentage >= 80) {
            target.setRating("GOOD");
            target.setCompletionStatus("IN PROGRESS");
            target.setCompletedDate(null);
        } else if (actualPercentage >= 50) {
            target.setRating("AVERAGE");
            target.setCompletionStatus("IN PROGRESS");
            target.setCompletedDate(null);
        } else {
            target.setRating("POOR");
            target.setCompletionStatus("IN PROGRESS");
            target.setCompletedDate(null);
        }
    }

    // ===========================
    // UPDATE TARGET
    // ===========================

    public SalesTarget updateTarget(SalesTarget target) {
        calculatePerformance(target);
        SalesTarget saved = repository.save(target);
        performanceService.recalculateAll();
        return saved;
    }
}