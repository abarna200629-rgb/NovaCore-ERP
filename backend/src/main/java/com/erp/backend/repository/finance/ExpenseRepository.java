package com.erp.backend.repository.finance;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.erp.backend.entity.finance.Expense;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ExpenseRepository
        extends JpaRepository<Expense, Long> {
    java.util.Optional<Expense> findByExpenseNameAndAmountAndExpenseDate(String expenseName, Double amount, String expenseDate);

    @Query("SELECT COALESCE(SUM(e.amount), 0.0) FROM Expense e WHERE e.expenseDate = :date")
    Double sumAmountByDate(@Param("date") String date);

    @Query("SELECT COALESCE(SUM(e.amount), 0.0) FROM Expense e WHERE e.expenseDate LIKE CONCAT(:yearMonth, '%')")
    Double sumAmountByYearMonth(@Param("yearMonth") String yearMonth);

    @Query(value = "SELECT SUBSTRING(e.expense_date, 1, 7) AS monthStr, SUM(e.amount) AS total FROM expenses e WHERE e.expense_date IS NOT NULL AND e.expense_date != '' GROUP BY SUBSTRING(e.expense_date, 1, 7) ORDER BY monthStr ASC", nativeQuery = true)
    List<Object[]> getMonthlyExpenses();
}