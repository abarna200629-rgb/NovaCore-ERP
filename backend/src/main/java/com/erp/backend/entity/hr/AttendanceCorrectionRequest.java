package com.erp.backend.entity.hr;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "attendance_corrections")
public class AttendanceCorrectionRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "attendance_id")
    private Long attendanceId;

    @Column(name = "employee_id")
    private Long employeeId;

    @Column(name = "request_date")
    private String requestDate;

    @Column(name = "requested_check_in")
    private LocalDateTime requestedCheckIn;

    @Column(name = "requested_check_out")
    private LocalDateTime requestedCheckOut;

    private String reason;

    private String status = "PENDING"; // PENDING, APPROVED, REJECTED

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getAttendanceId() {
        return attendanceId;
    }

    public void setAttendanceId(Long attendanceId) {
        this.attendanceId = attendanceId;
    }

    public Long getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(Long employeeId) {
        this.employeeId = employeeId;
    }

    public String getRequestDate() {
        return requestDate;
    }

    public void setRequestDate(String requestDate) {
        this.requestDate = requestDate;
    }

    public LocalDateTime getRequestedCheckIn() {
        return requestedCheckIn;
    }

    public void setRequestedCheckIn(LocalDateTime requestedCheckIn) {
        this.requestedCheckIn = requestedCheckIn;
    }

    public LocalDateTime getRequestedCheckOut() {
        return requestedCheckOut;
    }

    public void setRequestedCheckOut(LocalDateTime requestedCheckOut) {
        this.requestedCheckOut = requestedCheckOut;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
