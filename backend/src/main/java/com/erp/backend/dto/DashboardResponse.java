package com.erp.backend.dto;

import java.util.List;
import java.util.Map;

public class DashboardResponse {

private List<Map<String, Object>> financeTrendData;
private List<Map<String, Object>> productDistribution;


// EMPLOYEE
private Long employees;

// INVENTORY
private Long products;
private Long lowStockProducts;

// CUSTOMER
private Long customerCount;

// ATTENDANCE
private Long attendanceCount;
private Long presentToday;
private Long absentToday;
private Long lateToday;
private Long checkedOutToday;

// LEAVE
private Long leaveCount;
private Long pendingLeaves;
private Long employeesOnLeaveToday;
private Long approvedLeavesCount;
private Long rejectedLeavesCount;

// PRODUCTION
private Long productionCount;

// SALES
private Long salesCount;
private Double todaySalesAmount;

// TARGET
private Double targetAchievement;
private Double performanceRating;

// FINANCE
private Double income;
private Double expense;
private Double profit;

public DashboardResponse() {
}

public Long getEmployees() {
    return employees;
}

public void setEmployees(Long employees) {
    this.employees = employees;
}

public Long getProducts() {
    return products;
}

public void setProducts(Long products) {
    this.products = products;
}

public Long getLowStockProducts() {
    return lowStockProducts;
}

public void setLowStockProducts(Long lowStockProducts) {
    this.lowStockProducts = lowStockProducts;
}

public Long getCustomerCount() {
    return customerCount;
}

public void setCustomerCount(Long customerCount) {
    this.customerCount = customerCount;
}

public Long getAttendanceCount() {
    return attendanceCount;
}

public void setAttendanceCount(Long attendanceCount) {
    this.attendanceCount = attendanceCount;
}

public Long getPresentToday() {
    return presentToday;
}

public void setPresentToday(Long presentToday) {
    this.presentToday = presentToday;
}

public Long getAbsentToday() {
    return absentToday;
}

public void setAbsentToday(Long absentToday) {
    this.absentToday = absentToday;
}

public Long getLeaveCount() {
    return leaveCount;
}

public void setLeaveCount(Long leaveCount) {
    this.leaveCount = leaveCount;
}

public Long getPendingLeaves() {
    return pendingLeaves;
}

public void setPendingLeaves(Long pendingLeaves) {
    this.pendingLeaves = pendingLeaves;
}

public Long getProductionCount() {
    return productionCount;
}

public void setProductionCount(Long productionCount) {
    this.productionCount = productionCount;
}

public Long getSalesCount() {
    return salesCount;
}

public void setSalesCount(Long salesCount) {
    this.salesCount = salesCount;
}

public Double getTargetAchievement() {
    return targetAchievement;
}

public void setTargetAchievement(Double targetAchievement) {
    this.targetAchievement = targetAchievement;
}

public Double getIncome() {
    return income;
}

public void setIncome(Double income) {
    this.income = income;
}

public Double getExpense() {
    return expense;
}

public void setExpense(Double expense) {
    this.expense = expense;
}

public Double getProfit() {
    return profit;
}

public void setProfit(Double profit) {
    this.profit = profit;
}

public Long getLateToday() {
    return lateToday;
}

public void setLateToday(Long lateToday) {
    this.lateToday = lateToday;
}

public Long getCheckedOutToday() {
    return checkedOutToday;
}

public void setCheckedOutToday(Long checkedOutToday) {
    this.checkedOutToday = checkedOutToday;
}

public Double getTodaySalesAmount() {
    return todaySalesAmount;
}

public void setTodaySalesAmount(Double todaySalesAmount) {
    this.todaySalesAmount = todaySalesAmount;
}

public Double getPerformanceRating() {
    return performanceRating;
}

public void setPerformanceRating(Double performanceRating) {
    this.performanceRating = performanceRating;
}

public Long getEmployeesOnLeaveToday() {
    return employeesOnLeaveToday;
}

public void setEmployeesOnLeaveToday(Long employeesOnLeaveToday) {
    this.employeesOnLeaveToday = employeesOnLeaveToday;
}

public Long getApprovedLeavesCount() {
    return approvedLeavesCount;
}

public void setApprovedLeavesCount(Long approvedLeavesCount) {
    this.approvedLeavesCount = approvedLeavesCount;
}

public Long getRejectedLeavesCount() {
    return rejectedLeavesCount;
}

public void setRejectedLeavesCount(Long rejectedLeavesCount) {
    this.rejectedLeavesCount = rejectedLeavesCount;
}

public List<Map<String, Object>> getFinanceTrendData() {
    return financeTrendData;
}

public void setFinanceTrendData(List<Map<String, Object>> financeTrendData) {
    this.financeTrendData = financeTrendData;
}

public List<Map<String, Object>> getProductDistribution() {
    return productDistribution;
}

public void setProductDistribution(List<Map<String, Object>> productDistribution) {
    this.productDistribution = productDistribution;
}

}

