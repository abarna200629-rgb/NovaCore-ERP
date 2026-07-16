package com.erp.backend.controller.finance;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.erp.backend.entity.finance.Expense;
import com.erp.backend.service.finance.ExpenseService;

@RestController
@RequestMapping("/api/finance/expenses")
public class ExpenseController {

    @Autowired
    private ExpenseService service;

    @PostMapping
    public Expense addExpense(
            @RequestBody Expense expense) {

        return service.saveExpense(expense);
    }

    @GetMapping
    public List<Expense> getExpenses() {

        return service.getAllExpenses();
    }
}