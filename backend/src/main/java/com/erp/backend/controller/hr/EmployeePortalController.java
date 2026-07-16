package com.erp.backend.controller.hr;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.erp.backend.entity.Employee;
import com.erp.backend.entity.hr.LeaveRequest;
import com.erp.backend.entity.hr.Attendance;
import com.erp.backend.entity.hr.Payroll;
import com.erp.backend.repository.EmployeeRepository;
import com.erp.backend.repository.hr.LeaveRepository;
import com.erp.backend.repository.hr.AttendanceRepository;
import com.erp.backend.repository.hr.PayrollRepository;
import com.erp.backend.service.hr.LeaveService;
import com.erp.backend.service.hr.AttendanceService;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/employee")
@CrossOrigin("*")
public class EmployeePortalController {

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private LeaveRepository leaveRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private PayrollRepository payrollRepository;

    @Autowired
    private LeaveService leaveService;

    @Autowired
    private AttendanceService attendanceService;

    private Employee getAuthenticatedEmployee(Authentication auth) {
        if (auth == null) return null;
        return employeeRepository.findByEmpCode(auth.getName())
                .or(() -> employeeRepository.findAll().stream()
                        .filter(e -> e.getName() != null && e.getName().equalsIgnoreCase(auth.getName()))
                        .findFirst())
                .orElse(null);
    }

    @GetMapping("/profile")
    public Employee getProfile(Authentication auth) {
        return getAuthenticatedEmployee(auth);
    }

    @GetMapping("/attendance")
    public List<Attendance> getAttendance(Authentication auth) {
        Employee emp = getAuthenticatedEmployee(auth);
        if (emp == null) return List.of();
        return attendanceRepository.findByEmployeeId(emp.getId());
    }

    @PostMapping("/attendance/checkin")
    public Attendance checkIn(Authentication auth) {
        Employee emp = getAuthenticatedEmployee(auth);
        if (emp == null) {
            throw new RuntimeException("Logged-in employee profile not found.");
        }
        Attendance attendance = new Attendance();
        attendance.setEmployeeId(emp.getId());
        return attendanceService.saveAttendance(attendance);
    }

    @PutMapping("/attendance/checkout/{id}")
    public Attendance checkOut(Authentication auth, @PathVariable Long id) {
        Employee emp = getAuthenticatedEmployee(auth);
        if (emp == null) {
            throw new RuntimeException("Logged-in employee profile not found.");
        }
        Attendance att = attendanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Attendance record not found."));
        if (!att.getEmployeeId().equals(emp.getId())) {
            throw new RuntimeException("Unauthorized: You can only check out of your own attendance record.");
        }
        return attendanceService.updateCheckout(id);
    }

    @GetMapping("/leaves")
    public List<LeaveRequest> getLeaves(Authentication auth) {
        Employee emp = getAuthenticatedEmployee(auth);
        if (emp == null) return List.of();
        return leaveRepository.findAll().stream()
                .filter(l -> l.getEmployeeId() != null && l.getEmployeeId().equals(emp.getId()))
                .collect(Collectors.toList());
    }

    @PostMapping("/leaves")
    public LeaveRequest applyLeave(Authentication auth, @RequestBody LeaveRequest leaveRequest) {
        Employee emp = getAuthenticatedEmployee(auth);
        if (emp == null) {
            throw new RuntimeException("Logged-in employee profile not found.");
        }
        leaveRequest.setEmployeeId(emp.getId());
        return leaveService.applyLeave(leaveRequest);
    }

    @GetMapping("/payslips")
    public List<Payroll> getPayslips(Authentication auth) {
        Employee emp = getAuthenticatedEmployee(auth);
        if (emp == null) return List.of();
        return payrollRepository.findAll().stream()
                .filter(p -> p.getEmployeeId() != null && p.getEmployeeId().equals(emp.getId()))
                .collect(Collectors.toList());
    }

    @GetMapping("/leave-balance")
    public Map<String, Object> getLeaveBalance(Authentication auth) {
        Employee emp = getAuthenticatedEmployee(auth);
        Map<String, Object> response = new HashMap<>();
        if (emp == null) {
            response.put("leaveBalance", 15.0);
            return response;
        }
        response.put("leaveBalance", emp.getLeaveBalance() != null ? emp.getLeaveBalance() : 15.0);
        return response;
    }
}
