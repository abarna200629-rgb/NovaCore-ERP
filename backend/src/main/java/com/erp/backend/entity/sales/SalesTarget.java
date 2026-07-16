package com.erp.backend.entity.sales;

import java.time.LocalDate;

import jakarta.persistence.*;

@Entity
@Table(name = "sales_target")
public class SalesTarget {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Employee
    private Long employeeId;

    private String employeeName;

    // Product
    private Long productId;

    private String productName;

    // Target Details
    private Integer targetQuantity;

    private Integer achievedQuantity = 0;

    private String monthName;

    // Performance
    private Double achievementPercentage = 0.0;

    private String rating = "POOR";

    // Professional ERP Fields
    private Integer extraSales = 0;

    private Double overAchievementPercentage = 0.0;

    // Deadline Tracking
    private LocalDate deadline;

    private LocalDate completedDate;

    private String completionStatus = "PENDING";

    public SalesTarget() {
    }

    // ===========================
    // ID
    // ===========================

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    // ===========================
    // EMPLOYEE
    // ===========================

    public Long getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(Long employeeId) {
        this.employeeId = employeeId;
    }

    public String getEmployeeName() {
        return employeeName;
    }

    public void setEmployeeName(String employeeName) {
        this.employeeName = employeeName;
    }

    // ===========================
    // PRODUCT
    // ===========================

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    // ===========================
    // TARGET
    // ===========================

    public Integer getTargetQuantity() {
        return targetQuantity;
    }

    public void setTargetQuantity(Integer targetQuantity) {
        this.targetQuantity = targetQuantity;
    }

    public Integer getAchievedQuantity() {
        return achievedQuantity;
    }

    public void setAchievedQuantity(Integer achievedQuantity) {
        this.achievedQuantity = achievedQuantity;
    }

    public String getMonthName() {
        return monthName;
    }

    public void setMonthName(String monthName) {
        this.monthName = monthName;
    }

    // ===========================
    // PERFORMANCE
    // ===========================

    public Double getAchievementPercentage() {
        return achievementPercentage;
    }

    public void setAchievementPercentage(Double achievementPercentage) {
        this.achievementPercentage = achievementPercentage;
    }

    public String getRating() {
        return rating;
    }

    public void setRating(String rating) {
        this.rating = rating;
    }

    // ===========================
    // EXTRA SALES
    // ===========================

    public Integer getExtraSales() {
        return extraSales;
    }

    public void setExtraSales(Integer extraSales) {
        this.extraSales = extraSales;
    }

    public Double getOverAchievementPercentage() {
        return overAchievementPercentage;
    }

    public void setOverAchievementPercentage(Double overAchievementPercentage) {
        this.overAchievementPercentage = overAchievementPercentage;
    }

    // ===========================
    // DEADLINE
    // ===========================

    public LocalDate getDeadline() {
        return deadline;
    }

    public void setDeadline(LocalDate deadline) {
        this.deadline = deadline;
    }

    public LocalDate getCompletedDate() {
        return completedDate;
    }

    public void setCompletedDate(LocalDate completedDate) {
        this.completedDate = completedDate;
    }

    public String getCompletionStatus() {
        return completionStatus;
    }

    public void setCompletionStatus(String completionStatus) {
        this.completionStatus = completionStatus;
    }

}