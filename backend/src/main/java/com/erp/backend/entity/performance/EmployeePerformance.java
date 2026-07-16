package com.erp.backend.entity.performance;

import jakarta.persistence.*;

@Entity
@Table(name = "employee_performance")
public class EmployeePerformance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long employeeId;

    private String employeeName;

    private String monthName;

    private Double score;

    private String rating;

    // Added fields for complete integration
    private String department;

    private Integer targetQuantity = 0;

    private Integer achievedQuantity = 0;

    private Double achievementPercentage = 0.0;

    private String lastUpdated;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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

    public String getMonthName() {
        return monthName;
    }

    public void setMonthName(String monthName) {
        this.monthName = monthName;
    }

    public Double getScore() {
        return score;
    }

    public void setScore(Double score) {
        this.score = score;
    }

    public String getRating() {
        return rating;
    }

    public void setRating(String rating) {
        this.rating = rating;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

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

    public Double getAchievementPercentage() {
        return achievementPercentage;
    }

    public void setAchievementPercentage(Double achievementPercentage) {
        this.achievementPercentage = achievementPercentage;
    }

    public String getLastUpdated() {
        return lastUpdated;
    }

    public void setLastUpdated(String lastUpdated) {
        this.lastUpdated = lastUpdated;
    }
}