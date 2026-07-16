package com.erp.backend.service.hr;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.erp.backend.entity.hr.Attendance;
import com.erp.backend.entity.Employee;
import com.erp.backend.repository.EmployeeRepository;
import com.erp.backend.repository.hr.AttendanceRepository;

@Service
public class AttendanceService {

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    // Company Timing
    private static final LocalTime OFFICE_START_TIME =
            LocalTime.of(9, 0);

    private static final int GRACE_MINUTES = 15;

    public void calculateMetrics(Attendance attendance) {
        if (attendance.getCheckInTime() != null && attendance.getCheckOutTime() != null) {
            double workingHours = Duration.between(attendance.getCheckInTime(), attendance.getCheckOutTime()).toMinutes() / 60.0;
            attendance.setWorkingHours(Math.round(workingHours * 100.0) / 100.0);

            // Overtime & Undertime
            if (workingHours > 8.0) {
                attendance.setOvertime(Math.round((workingHours - 8.0) * 100.0) / 100.0);
                attendance.setUndertime(0.0);
            } else {
                attendance.setUndertime(Math.round((8.0 - workingHours) * 100.0) / 100.0);
                attendance.setOvertime(0.0);
            }

            // Late minutes
            LocalTime checkInLocalTime = attendance.getCheckInTime().toLocalTime();
            if (checkInLocalTime.isAfter(LocalTime.of(9, 15))) {
                long late = Duration.between(LocalTime.of(9, 0), checkInLocalTime).toMinutes();
                attendance.setLateMinutes((int) late);
            } else {
                attendance.setLateMinutes(0);
            }

            // Early leaving minutes
            LocalTime checkOutLocalTime = attendance.getCheckOutTime().toLocalTime();
            if (checkOutLocalTime.isBefore(LocalTime.of(17, 0))) {
                long early = Duration.between(checkOutLocalTime, LocalTime.of(17, 0)).toMinutes();
                attendance.setEarlyLeavingMinutes((int) early);
            } else {
                attendance.setEarlyLeavingMinutes(0);
            }
        } else {
            attendance.setWorkingHours(0.0);
            attendance.setOvertime(0.0);
            attendance.setUndertime(0.0);
            attendance.setLateMinutes(0);
            attendance.setEarlyLeavingMinutes(0);

            if (attendance.getCheckInTime() != null) {
                LocalTime checkInLocalTime = attendance.getCheckInTime().toLocalTime();
                if (checkInLocalTime.isAfter(LocalTime.of(9, 15))) {
                    long late = Duration.between(LocalTime.of(9, 0), checkInLocalTime).toMinutes();
                    attendance.setLateMinutes((int) late);
                } else {
                    attendance.setLateMinutes(0);
                }
            }
        }
    }

    public Attendance saveAttendance(
            Attendance attendance) {

        Employee employee = employeeRepository.findById(attendance.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee ID Not Found"));

        if (!"ACTIVE".equalsIgnoreCase(employee.getStatus())) {
            throw new RuntimeException("Attendance Error: Inactive employees cannot check in!");
        }

        String today =
                LocalDate.now().toString();

        // Already Marked Today Check
        Attendance existingAttendance =
                attendanceRepository
                        .findByEmployeeIdAndDate(
                                attendance.getEmployeeId(),
                                today)
                        .orElse(null);

        if (existingAttendance != null) {

            throw new RuntimeException(
                    "Attendance Already Marked Today");
        }

        LocalDateTime now =
                LocalDateTime.now();

        attendance.setDate(today);

        attendance.setCheckInTime(now);

        attendance.setCheckOutTime(null);

        // Attendance Status Logic
        LocalTime graceTime =
                OFFICE_START_TIME.plusMinutes(
                        GRACE_MINUTES);

        if (now.toLocalTime().isAfter(graceTime)) {

            attendance.setStatus("LATE");

        } else {

            attendance.setStatus("PRESENT");
        }

        calculateMetrics(attendance);

        return attendanceRepository.save(
                attendance);
    }

    public List<Attendance> getAllAttendance() {

        return attendanceRepository.findAll();
    }

    public Attendance getAttendanceById(
            Long id) {

        return attendanceRepository
                .findById(id)
                .orElse(null);
    }

    public Attendance updateCheckout(
            Long id) {

        Attendance attendance =
                attendanceRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Attendance Not Found"));

        Employee employee = employeeRepository.findById(attendance.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee ID Not Found"));

        if (!"ACTIVE".equalsIgnoreCase(employee.getStatus())) {
            throw new RuntimeException("Attendance Error: Inactive employees cannot check out!");
        }

        if (attendance.getCheckOutTime()
                != null) {

            throw new RuntimeException(
                    "Already Checked Out");
        }

        LocalDateTime checkout =
                LocalDateTime.now();

        attendance.setCheckOutTime(checkout);

        calculateMetrics(attendance);

        return attendanceRepository.save(
                attendance);
    }

    public Attendance updateAttendance(Long id, Attendance details) {
        Attendance existing = attendanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Attendance Not Found"));

        if (details.getCheckInTime() != null && details.getCheckOutTime() != null) {
            if (details.getCheckOutTime().isBefore(details.getCheckInTime())) {
                throw new RuntimeException("Check-Out time cannot be before Check-In time!");
            }
        }

        existing.setStatus(details.getStatus());
        existing.setDate(details.getDate());
        existing.setCheckInTime(details.getCheckInTime());
        existing.setCheckOutTime(details.getCheckOutTime());
        existing.setRemarks(details.getRemarks());

        calculateMetrics(existing);

        return attendanceRepository.save(existing);
    }

    public void deleteAttendance(
            Long id) {

        attendanceRepository.deleteById(id);
    }

    public Long getAttendanceCount() {

        return attendanceRepository.count();
    }
}