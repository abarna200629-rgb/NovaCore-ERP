package com.erp.backend.entity.hr;

import jakarta.persistence.*;

@Entity
@Table(name = "payroll")
public class Payroll {


@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;

private Long employeeId;

private String employeeName;

private String department;

private Double basicSalary;

private Double bonus;

private Double deduction;

private Double netSalary;

private Integer absentDays;

private Integer lateCount;

private Integer taskCompletionPercentage;

private Double performanceBonus;

private Double absentDeduction;

private Double lateDeduction;

private String payrollMonth;

// Constructors
public Payroll() {
}

// ID
public Long getId() {
    return id;
}

public void setId(Long id) {
    this.id = id;
}

// Employee ID
public Long getEmployeeId() {
    return employeeId;
}

public void setEmployeeId(Long employeeId) {
    this.employeeId = employeeId;
}

// Employee Name
public String getEmployeeName() {
    return employeeName;
}

public void setEmployeeName(String employeeName) {
    this.employeeName = employeeName;
}

// Department
public String getDepartment() {
    return department;
}

public void setDepartment(String department) {
    this.department = department;
}

// Basic Salary
public Double getBasicSalary() {
    return basicSalary;
}

public void setBasicSalary(Double basicSalary) {
    this.basicSalary = basicSalary;
}

// Bonus
public Double getBonus() {
    return bonus;
}

public void setBonus(Double bonus) {
    this.bonus = bonus;
}

// Deduction
public Double getDeduction() {
    return deduction;
}

public void setDeduction(Double deduction) {
    this.deduction = deduction;
}

// Net Salary
public Double getNetSalary() {
    return netSalary;
}

public void setNetSalary(Double netSalary) {
    this.netSalary = netSalary;
}

// Absent Days
public Integer getAbsentDays() {
    return absentDays;
}

public void setAbsentDays(Integer absentDays) {
    this.absentDays = absentDays;
}

// Late Count
public Integer getLateCount() {
    return lateCount;
}

public void setLateCount(Integer lateCount) {
    this.lateCount = lateCount;
}

// Task Completion %
public Integer getTaskCompletionPercentage() {
    return taskCompletionPercentage;
}

public void setTaskCompletionPercentage(Integer taskCompletionPercentage) {
    this.taskCompletionPercentage = taskCompletionPercentage;
}

// Performance Bonus
public Double getPerformanceBonus() {
    return performanceBonus;
}

public void setPerformanceBonus(Double performanceBonus) {
    this.performanceBonus = performanceBonus;
}

// Absent Deduction
public Double getAbsentDeduction() {
    return absentDeduction;
}

public void setAbsentDeduction(Double absentDeduction) {
    this.absentDeduction = absentDeduction;
}

// Late Deduction
public Double getLateDeduction() {
    return lateDeduction;
}

public void setLateDeduction(Double lateDeduction) {
    this.lateDeduction = lateDeduction;
}

// Payroll Month
public String getPayrollMonth() {
    return payrollMonth;
}

public void setPayrollMonth(String payrollMonth) {
    this.payrollMonth = payrollMonth;
}


}
