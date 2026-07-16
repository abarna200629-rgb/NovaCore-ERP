package com.erp.backend.repository.hr;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.erp.backend.entity.hr.Attendance;

public interface AttendanceRepository
        extends JpaRepository<Attendance, Long> {

    Optional<Attendance> findByEmployeeIdAndDate(
            Long employeeId,
            String date);

    Long countByDateAndStatus(
            String date,
            String status);

    java.util.List<Attendance> findByDate(String date);
    java.util.List<Attendance> findByEmployeeId(Long employeeId);
}