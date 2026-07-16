package com.erp.backend.service.finance;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.erp.backend.entity.finance.Income;
import com.erp.backend.repository.finance.IncomeRepository;
import com.erp.backend.exception.DuplicateRecordException;

@Service
public class IncomeService {

    @Autowired
    private IncomeRepository repository;

    public Income saveIncome(Income income) {
        if (income.getIncomeSource() != null && !income.getIncomeSource().trim().isEmpty() &&
            income.getAmount() != null && income.getIncomeDate() != null) {
            String source = income.getIncomeSource().trim();
            if (repository.findByIncomeSourceAndAmountAndIncomeDate(source, income.getAmount(), income.getIncomeDate()).isPresent()) {
                throw new DuplicateRecordException("Transaction already exists on this date.");
            }
        }
        return repository.save(income);
    }

    public List<Income> getAllIncome() {
        return repository.findAll();
    }
    public void deleteIncomeBySource(
            String source) {

        List<Income> incomes =
                repository.findByIncomeSource(
                        source);

        repository.deleteAll(incomes);
    }
}