package com.erp.backend.service.finance;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.erp.backend.entity.finance.Expense;
import com.erp.backend.repository.finance.ExpenseRepository;
import com.erp.backend.exception.DuplicateRecordException;

@Service
public class ExpenseService {

    @Autowired
    private ExpenseRepository repository;

    public Expense saveExpense(Expense expense) {
        if (expense.getExpenseName() != null && !expense.getExpenseName().trim().isEmpty() &&
            expense.getAmount() != null && expense.getExpenseDate() != null) {
            String name = expense.getExpenseName().trim();
            if (repository.findByExpenseNameAndAmountAndExpenseDate(name, expense.getAmount(), expense.getExpenseDate()).isPresent()) {
                throw new DuplicateRecordException("Transaction already exists on this date.");
            }
        }
        return repository.save(expense);
    }

    public List<Expense> getAllExpenses() {
        return repository.findAll();
    }
}