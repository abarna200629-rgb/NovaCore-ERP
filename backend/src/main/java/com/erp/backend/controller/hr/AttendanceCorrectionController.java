package com.erp.backend.controller.hr;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import com.erp.backend.entity.hr.AttendanceCorrectionRequest;
import com.erp.backend.entity.hr.Attendance;
import com.erp.backend.entity.Employee;
import com.erp.backend.repository.hr.AttendanceCorrectionRequestRepository;
import com.erp.backend.repository.hr.AttendanceRepository;
import com.erp.backend.repository.EmployeeRepository;
import com.erp.backend.service.hr.AttendanceService;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/hr/attendance/corrections")
@CrossOrigin("*")
public class AttendanceCorrectionController {

    @Autowired
    private AttendanceCorrectionRequestRepository repository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private AttendanceService attendanceService;

    @PostMapping
    public AttendanceCorrectionRequest submitRequest(@RequestBody AttendanceCorrectionRequest request, Authentication auth) {
        // Find employee id if role is employee
        String role = auth.getAuthorities().iterator().next().getAuthority().toUpperCase().replace("ROLE_", "");
        if ("EMPLOYEE".equalsIgnoreCase(role)) {
            Employee emp = employeeRepository.findByEmpCode(auth.getName()).orElse(null);
            if (emp != null) {
                request.setEmployeeId(emp.getId());
            }
        }
        request.setStatus("PENDING");
        return repository.save(request);
    }

    @GetMapping
    public List<AttendanceCorrectionRequest> getRequests(Authentication auth) {
        String role = auth.getAuthorities().iterator().next().getAuthority().toUpperCase().replace("ROLE_", "");
        if ("EMPLOYEE".equalsIgnoreCase(role)) {
            Employee emp = employeeRepository.findByEmpCode(auth.getName()).orElse(null);
            if (emp != null) {
                return repository.findByEmployeeId(emp.getId());
            } else {
                return List.of();
            }
        }
        return repository.findAll();
    }

    @PutMapping("/approve/{id}")
    public AttendanceCorrectionRequest approveRequest(@PathVariable Long id) {
        AttendanceCorrectionRequest request = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Correction Request Not Found"));
        request.setStatus("APPROVED");

        Attendance attendance;
        if (request.getAttendanceId() != null) {
            attendance = attendanceRepository.findById(request.getAttendanceId())
                    .orElse(new Attendance());
        } else {
            attendance = new Attendance();
        }

        attendance.setEmployeeId(request.getEmployeeId());
        attendance.setDate(request.getRequestDate());
        attendance.setCheckInTime(request.getRequestedCheckIn());
        attendance.setCheckOutTime(request.getRequestedCheckOut());
        attendance.setStatus("PRESENT");
        attendance.setRemarks("Correction Approved: " + request.getReason());

        attendanceService.calculateMetrics(attendance);
        attendanceRepository.save(attendance);

        return repository.save(request);
    }

    @PutMapping("/reject/{id}")
    public AttendanceCorrectionRequest rejectRequest(@PathVariable Long id) {
        AttendanceCorrectionRequest request = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Correction Request Not Found"));
        request.setStatus("REJECTED");
        return repository.save(request);
    }
}
