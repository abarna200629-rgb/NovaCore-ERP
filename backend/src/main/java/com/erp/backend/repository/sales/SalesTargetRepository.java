package com.erp.backend.repository.sales;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.erp.backend.entity.sales.SalesTarget;

public interface SalesTargetRepository
        extends JpaRepository<SalesTarget, Long> {

    @Query("SELECT SUM(s.targetQuantity) FROM SalesTarget s")
    Integer getTotalTarget();

    @Query("SELECT SUM(s.achievedQuantity) FROM SalesTarget s")
    Integer getTotalAchieved();

    Optional<SalesTarget> findByEmployeeIdAndProductNameAndMonthName(
            Long employeeId,
            String productName,
            String monthName);

    Optional<SalesTarget> findByEmployeeIdAndProductIdAndMonthName(
            Long employeeId,
            Long productId,
            String monthName);

    @Query("""
            SELECT COUNT(s)
            FROM SalesTarget s
            WHERE s.employeeId=?1
            """)
    Long countByEmployee(Long employeeId);

    @Query("""
            SELECT COUNT(s)
            FROM SalesTarget s
            WHERE s.completionStatus='COMPLETED'
            """)
    Long completedTargets();

    @Query("""
            SELECT COUNT(s)
            FROM SalesTarget s
            WHERE s.completionStatus='LATE'
            """)
    Long lateCompletedTargets();

    @Query("""
            SELECT COUNT(s)
            FROM SalesTarget s
            WHERE s.achievementPercentage<100
            """)
    Long pendingTargets();
}