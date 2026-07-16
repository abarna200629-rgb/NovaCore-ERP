package com.erp.backend.controller.finance;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.erp.backend.entity.finance.Income;
import com.erp.backend.service.finance.IncomeService;

@RestController
@RequestMapping("/api/finance/income")
public class IncomeController {

    @Autowired
    private IncomeService service;

    @PostMapping
    public Income addIncome(
            @RequestBody Income income) {

        System.out.println("SOURCE = "
                + income.getIncomeSource());

        System.out.println("AMOUNT = "
                + income.getAmount());

        return service.saveIncome(income);
    }

    @GetMapping
    public List<Income> getIncome() {

        return service.getAllIncome();
    }
}