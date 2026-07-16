package com.erp.backend.dto.hr;

public class BurnoutAnalysis {
    private Long employeeId;
    private String employeeName;
    private String empCode;
    private String department;
    private Double attendanceRate;
    private Integer lateCheckIns;
    private Integer leavesTaken;
    private Integer consecutiveDays;
    private Double overtimeHours;
    private Integer absentDays;
    private Double averageWorkingHours;
    private Integer pendingTasks;
    private Integer burnoutScore;
    private String riskLevel;
    private String recommendation;

    // Getters and Setters
    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }

    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }

    public String getEmpCode() { return empCode; }
    public void setEmpCode(String empCode) { this.empCode = empCode; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public Double getAttendanceRate() { return attendanceRate; }
    public void setAttendanceRate(Double attendanceRate) { this.attendanceRate = attendanceRate; }

    public Integer getLateCheckIns() { return lateCheckIns; }
    public void setLateCheckIns(Integer lateCheckIns) { this.lateCheckIns = lateCheckIns; }

    public Integer getLeavesTaken() { return leavesTaken; }
    public void setLeavesTaken(Integer leavesTaken) { this.leavesTaken = leavesTaken; }

    public Integer getConsecutiveDays() { return consecutiveDays; }
    public void setConsecutiveDays(Integer consecutiveDays) { this.consecutiveDays = consecutiveDays; }

    public Double getOvertimeHours() { return overtimeHours; }
    public void setOvertimeHours(Double overtimeHours) { this.overtimeHours = overtimeHours; }

    public Integer getAbsentDays() { return absentDays; }
    public void setAbsentDays(Integer absentDays) { this.absentDays = absentDays; }

    public Double getAverageWorkingHours() { return averageWorkingHours; }
    public void setAverageWorkingHours(Double averageWorkingHours) { this.averageWorkingHours = averageWorkingHours; }

    public Integer getPendingTasks() { return pendingTasks; }
    public void setPendingTasks(Integer pendingTasks) { this.pendingTasks = pendingTasks; }

    public Integer getBurnoutScore() { return burnoutScore; }
    public void setBurnoutScore(Integer burnoutScore) { this.burnoutScore = burnoutScore; }

    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }

    public String getRecommendation() { return recommendation; }
    public void setRecommendation(String recommendation) { this.recommendation = recommendation; }
}
