package com.erp.backend.repository.finance;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.erp.backend.entity.finance.Income;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface IncomeRepository
        extends JpaRepository<Income, Long> {

    List<Income> findByIncomeSource(
            String incomeSource);
    java.util.Optional<Income> findByIncomeSourceAndAmountAndIncomeDate(String incomeSource, Double amount, String incomeDate);

    @Query("SELECT COALESCE(SUM(i.amount), 0.0) FROM Income i WHERE i.incomeDate = :date")
    Double sumAmountByDate(@Param("date") String date);

    @Query("SELECT COALESCE(SUM(i.amount), 0.0) FROM Income i WHERE i.incomeDate LIKE CONCAT(:yearMonth, '%')")
    Double sumAmountByYearMonth(@Param("yearMonth") String yearMonth);

    @Query(value = "SELECT SUBSTRING(i.income_date, 1, 7) AS monthStr, SUM(i.amount) AS total FROM income i WHERE i.income_date IS NOT NULL AND i.income_date != '' GROUP BY SUBSTRING(i.income_date, 1, 7) ORDER BY monthStr ASC", nativeQuery = true)
    List<Object[]> getMonthlyIncome();
}