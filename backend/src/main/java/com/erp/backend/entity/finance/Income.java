package com.erp.backend.entity.finance;

import jakarta.persistence.*;

@Entity
@Table(name = "income")
public class Income {

@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;

private String incomeSource;

private Double amount;

private String incomeDate;

public Long getId() {
    return id;
}

public void setId(Long id) {
    this.id = id;
}

public String getIncomeSource() {
    return incomeSource;
}

public void setIncomeSource(String incomeSource) {
    this.incomeSource = incomeSource;
}

public Double getAmount() {
    return amount;
}

public void setAmount(Double amount) {
    this.amount = amount;
}

public String getIncomeDate() {
    return incomeDate;
}

public void setIncomeDate(String incomeDate) {
    this.incomeDate = incomeDate;
}


}
