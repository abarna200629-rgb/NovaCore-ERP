package com.erp.backend.entity.hr;

import jakarta.persistence.*;

@Entity
@Table(name = "leave_requests")
public class LeaveRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long employeeId;

    private String reason;

    private String fromDate;

    private String toDate;

    private String status;
    private String leaveType;
    private Double totalDays;
    private String dayType = "Full Day";
    private String stage;
    private String supportingDocPath;
    private String hrComments;
    private String aiRecommendation;
    private Integer aiConfidenceScore;
    private String aiReason;
    private String aiLeaveBalance;
    private String aiAttendanceSummary;
    private String aiMedicalCertificateStatus;
    private String aiTeamAvailability;
    private String aiPolicyCompliance;

    public LeaveRequest() {
    }

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

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getFromDate() {
        return fromDate;
    }

    public void setFromDate(String fromDate) {
        this.fromDate = fromDate;
    }

    public String getToDate() {
        return toDate;
    }

    public void setToDate(String toDate) {
        this.toDate = toDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getLeaveType() {
        return leaveType;
    }

    public void setLeaveType(String leaveType) {
        this.leaveType = leaveType;
    }

    public Double getTotalDays() {
        return totalDays;
    }

    public void setTotalDays(Double totalDays) {
        this.totalDays = totalDays;
    }

    public String getStage() {
        return stage;
    }

    public void setStage(String stage) {
        this.stage = stage;
    }

    public String getSupportingDocPath() {
        return supportingDocPath;
    }

    public void setSupportingDocPath(String supportingDocPath) {
        this.supportingDocPath = supportingDocPath;
    }

    public String getHrComments() {
        return hrComments;
    }

    public void setHrComments(String hrComments) {
        this.hrComments = hrComments;
    }

    public String getAiRecommendation() {
        return aiRecommendation;
    }

    public void setAiRecommendation(String aiRecommendation) {
        this.aiRecommendation = aiRecommendation;
    }

    public Integer getAiConfidenceScore() {
        return aiConfidenceScore;
    }

    public void setAiConfidenceScore(Integer aiConfidenceScore) {
        this.aiConfidenceScore = aiConfidenceScore;
    }

    public String getAiReason() {
        return aiReason;
    }

    public void setAiReason(String aiReason) {
        this.aiReason = aiReason;
    }

    public String getAiLeaveBalance() {
        return aiLeaveBalance;
    }

    public void setAiLeaveBalance(String aiLeaveBalance) {
        this.aiLeaveBalance = aiLeaveBalance;
    }

    public String getAiAttendanceSummary() {
        return aiAttendanceSummary;
    }

    public void setAiAttendanceSummary(String aiAttendanceSummary) {
        this.aiAttendanceSummary = aiAttendanceSummary;
    }

    public String getAiMedicalCertificateStatus() {
        return aiMedicalCertificateStatus;
    }

    public void setAiMedicalCertificateStatus(String aiMedicalCertificateStatus) {
        this.aiMedicalCertificateStatus = aiMedicalCertificateStatus;
    }

    public String getAiTeamAvailability() {
        return aiTeamAvailability;
    }

    public void setAiTeamAvailability(String aiTeamAvailability) {
        this.aiTeamAvailability = aiTeamAvailability;
    }

    public String getAiPolicyCompliance() {
        return aiPolicyCompliance;
    }

    public void setAiPolicyCompliance(String aiPolicyCompliance) {
        this.aiPolicyCompliance = aiPolicyCompliance;
    }

    private String emergencyContact;
    private String appliedDate = java.time.LocalDate.now().toString();
    private String appliedBy;
    private String approvedBy;
    private String approvedDate;

    public String getEmergencyContact() {
        return emergencyContact;
    }

    public void setEmergencyContact(String emergencyContact) {
        this.emergencyContact = emergencyContact;
    }

    public String getAppliedDate() {
        return appliedDate;
    }

    public void setAppliedDate(String appliedDate) {
        this.appliedDate = appliedDate;
    }

    public String getAppliedBy() {
        return appliedBy;
    }

    public void setAppliedBy(String appliedBy) {
        this.appliedBy = appliedBy;
    }

    public String getApprovedBy() {
        return approvedBy;
    }

    public void setApprovedBy(String approvedBy) {
        this.approvedBy = approvedBy;
    }

    public String getApprovedDate() {
        return approvedDate;
    }

    public void setApprovedDate(String approvedDate) {
        this.approvedDate = approvedDate;
    }

    public String getDayType() {
        return dayType;
    }

    public void setDayType(String dayType) {
        this.dayType = dayType;
    }
}