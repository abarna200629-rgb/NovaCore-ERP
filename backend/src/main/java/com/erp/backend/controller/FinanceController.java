package com.erp.backend.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import com.erp.backend.entity.finance.Income;
import com.erp.backend.entity.finance.Expense;
import com.erp.backend.service.finance.IncomeService;
import com.erp.backend.service.finance.ExpenseService;
import java.util.List;
import java.util.ArrayList;

@RestController
@CrossOrigin("*")
public class FinanceController {

    @Autowired
    private IncomeService incomeService;

    @Autowired
    private ExpenseService expenseService;

    public static class FinanceRecord {
        private Long id;
        private String type;
        private Double amount;
        private String category;
        private String description;
        private String date;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public Double getAmount() { return amount; }
        public void setAmount(Double amount) { this.amount = amount; }
        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }
    }

    @PreAuthorize("hasAnyRole('ADMIN','FINANCE')")
    @GetMapping("/api/finance/dashboard")
    public String financeDashboard() {
        return "Welcome FINANCE";
    }

    @GetMapping("/api/finance/records")
    public List<FinanceRecord> getFinanceRecords() {
        List<Income> incomes = incomeService.getAllIncome();
        List<Expense> expenses = expenseService.getAllExpenses();

        // Seed mock data if database is empty
        if (incomes.isEmpty() && expenses.isEmpty()) {
            Income i1 = new Income();
            i1.setIncomeSource("Sales Revenue");
            i1.setAmount(150000.0);
            i1.setIncomeDate("2026-06-25");
            incomeService.saveIncome(i1);

            Income i2 = new Income();
            i2.setIncomeSource("Services");
            i2.setAmount(45000.0);
            i2.setIncomeDate("2026-06-28");
            incomeService.saveIncome(i2);

            Expense e1 = new Expense();
            e1.setExpenseName("Salary");
            e1.setAmount(60000.0);
            e1.setExpenseDate("2026-06-30");
            expenseService.saveExpense(e1);

            Expense e2 = new Expense();
            e2.setExpenseName("Materials");
            e2.setAmount(35000.0);
            e2.setExpenseDate("2026-07-02");
            expenseService.saveExpense(e2);

            incomes = incomeService.getAllIncome();
            expenses = expenseService.getAllExpenses();
        }

        List<FinanceRecord> records = new ArrayList<>();
        long recordId = 1;

        for (Income inc : incomes) {
            FinanceRecord rec = new FinanceRecord();
            rec.setId(recordId++);
            rec.setType("INCOME");
            rec.setAmount(inc.getAmount());
            rec.setCategory(inc.getIncomeSource());
            rec.setDescription(inc.getIncomeSource() + " Transaction");
            rec.setDate(inc.getIncomeDate());
            records.add(rec);
        }

        for (Expense exp : expenses) {
            FinanceRecord rec = new FinanceRecord();
            rec.setId(recordId++);
            rec.setType("EXPENSE");
            rec.setAmount(exp.getAmount());
            rec.setCategory(exp.getExpenseName());
            rec.setDescription(exp.getExpenseName() + " Outflow");
            rec.setDate(exp.getExpenseDate());
            records.add(rec);
        }

        return records;
    }

    @PostMapping("/api/finance/records")
    public FinanceRecord addFinanceRecord(@RequestBody FinanceRecord rec) {
        if ("INCOME".equalsIgnoreCase(rec.getType())) {
            Income inc = new Income();
            inc.setIncomeSource(rec.getCategory());
            inc.setAmount(rec.getAmount());
            inc.setIncomeDate(rec.getDate() != null ? rec.getDate() : "2026-07-03");
            incomeService.saveIncome(inc);
        } else if ("EXPENSE".equalsIgnoreCase(rec.getType())) {
            Expense exp = new Expense();
            exp.setExpenseName(rec.getCategory());
            exp.setAmount(rec.getAmount());
            exp.setExpenseDate(rec.getDate() != null ? rec.getDate() : "2026-07-03");
            expenseService.saveExpense(exp);
        }
        return rec;
    }

    public static class PnlResponse {
        private Double totalRevenue;
        private Double totalExpense;
        private Double netProfit;

        public Double getTotalRevenue() { return totalRevenue; }
        public void setTotalRevenue(Double totalRevenue) { this.totalRevenue = totalRevenue; }
        public Double getTotalExpense() { return totalExpense; }
        public void setTotalExpense(Double totalExpense) { this.totalExpense = totalExpense; }
        public Double getNetProfit() { return netProfit; }
        public void setNetProfit(Double netProfit) { this.netProfit = netProfit; }
    }

    public static class CashFlowResponse {
        private Double cashInflow;
        private Double cashOutflow;
        private Double netCashFlow;

        public Double getCashInflow() { return cashInflow; }
        public void setCashInflow(Double cashInflow) { this.cashInflow = cashInflow; }
        public Double getCashOutflow() { return cashOutflow; }
        public void setCashOutflow(Double cashOutflow) { this.cashOutflow = cashOutflow; }
        public Double getNetCashFlow() { return netCashFlow; }
        public void setNetCashFlow(Double netCashFlow) { this.netCashFlow = netCashFlow; }
    }

    public static class BalanceSheetResponse {
        private Double inventoryValue;
        private Double cashAsset;
        private Double accountsReceivable;
        private Double totalAssets;
        private Double accountsPayable;
        private Double equity;
        private Double totalLiabilitiesAndEquity;

        public Double getInventoryValue() { return inventoryValue; }
        public void setInventoryValue(Double inventoryValue) { this.inventoryValue = inventoryValue; }
        public Double getCashAsset() { return cashAsset; }
        public void setCashAsset(Double cashAsset) { this.cashAsset = cashAsset; }
        public Double getAccountsReceivable() { return accountsReceivable; }
        public void setAccountsReceivable(Double accountsReceivable) { this.accountsReceivable = accountsReceivable; }
        public Double getTotalAssets() { return totalAssets; }
        public void setTotalAssets(Double totalAssets) { this.totalAssets = totalAssets; }
        public Double getAccountsPayable() { return accountsPayable; }
        public void setAccountsPayable(Double accountsPayable) { this.accountsPayable = accountsPayable; }
        public Double getEquity() { return equity; }
        public void setEquity(Double equity) { this.equity = equity; }
        public Double getTotalLiabilitiesAndEquity() { return totalLiabilitiesAndEquity; }
        public void setTotalLiabilitiesAndEquity(Double totalLiabilitiesAndEquity) { this.totalLiabilitiesAndEquity = totalLiabilitiesAndEquity; }
    }

    @GetMapping("/api/finance/reports/profit-loss")
    public PnlResponse getProfitLossReport() {
        List<Income> incomes = incomeService.getAllIncome();
        List<Expense> expenses = expenseService.getAllExpenses();
        double totalRev = incomes.stream().mapToDouble(Income::getAmount).sum();
        double totalExp = expenses.stream().mapToDouble(Expense::getAmount).sum();

        PnlResponse res = new PnlResponse();
        res.setTotalRevenue(totalRev);
        res.setTotalExpense(totalExp);
        res.setNetProfit(totalRev - totalExp);
        return res;
    }

    @GetMapping("/api/finance/reports/cash-flow")
    public CashFlowResponse getCashFlowReport() {
        List<Income> incomes = incomeService.getAllIncome();
        List<Expense> expenses = expenseService.getAllExpenses();
        double totalRev = incomes.stream().mapToDouble(Income::getAmount).sum();
        double totalExp = expenses.stream().mapToDouble(Expense::getAmount).sum();

        CashFlowResponse res = new CashFlowResponse();
        res.setCashInflow(totalRev);
        res.setCashOutflow(totalExp);
        res.setNetCashFlow(totalRev - totalExp);
        return res;
    }

    @GetMapping("/api/finance/reports/balance-sheet")
    public BalanceSheetResponse getBalanceSheetReport() {
        List<Income> incomes = incomeService.getAllIncome();
        List<Expense> expenses = expenseService.getAllExpenses();
        double totalRev = incomes.stream().mapToDouble(Income::getAmount).sum();
        double totalExp = expenses.stream().mapToDouble(Expense::getAmount).sum();

        double inv = 120000.0;
        double cash = Math.max(0.0, totalRev - totalExp);
        double ar = 25000.0;
        double assets = inv + cash + ar;
        double ap = 15000.0;
        double equity = assets - ap;

        BalanceSheetResponse res = new BalanceSheetResponse();
        res.setInventoryValue(inv);
        res.setCashAsset(cash);
        res.setAccountsReceivable(ar);
        res.setTotalAssets(assets);
        res.setAccountsPayable(ap);
        res.setEquity(equity);
        res.setTotalLiabilitiesAndEquity(ap + equity);
        return res;
    }
}