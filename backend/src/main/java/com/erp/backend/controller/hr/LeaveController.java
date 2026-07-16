package com.erp.backend.controller.hr;

import java.util.List;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;

import com.erp.backend.entity.hr.LeaveRequest;
import com.erp.backend.entity.Employee;
import com.erp.backend.repository.EmployeeRepository;
import com.erp.backend.service.hr.LeaveService;

@RestController
@RequestMapping("/api/hr/leaves")
public class LeaveController {

    @Autowired
    private LeaveService service;

    @Autowired
    private EmployeeRepository employeeRepository;

    @PostMapping
    public LeaveRequest applyLeave(
            @RequestBody LeaveRequest leaveRequest) {

        return service.applyLeave(leaveRequest);
    }

    @GetMapping
    public List<LeaveRequest> getLeaves(Authentication auth) {
        String role = auth.getAuthorities().iterator().next().getAuthority().toUpperCase().replace("ROLE_", "");
        if ("EMPLOYEE".equalsIgnoreCase(role)) {
            Employee emp = employeeRepository.findByEmpCode(auth.getName()).orElse(null);
            if (emp != null) {
                return service.getAllLeaves().stream()
                        .filter(l -> l.getEmployeeId() != null && l.getEmployeeId().equals(emp.getId()))
                        .collect(Collectors.toList());
            } else {
                return List.of();
            }
        }
        return service.getAllLeaves();
    }

    @DeleteMapping("/{id}")
    public void deleteLeave(
            @PathVariable Long id) {
        service.deleteLeave(id);
    }

    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN', 'HR', 'ROLE_HR')")
    @PutMapping("/manager-approve/{id}")
    public LeaveRequest managerApprove(@PathVariable Long id) {
        return service.managerApprove(id);
    }

    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN', 'HR', 'ROLE_HR')")
    @PutMapping("/hr-approve/{id}")
    public LeaveRequest hrApprove(@PathVariable Long id) {
        return service.hrApprove(id);
    }

    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN', 'HR', 'ROLE_HR')")
    @PutMapping("/reject/{id}")
    public LeaveRequest rejectLeave(
            @PathVariable Long id,
            @RequestParam(required = false) String hrComment) {
        return service.reject(id, hrComment);
    }

    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN', 'HR', 'ROLE_HR')")
    @PutMapping("/request-docs/{id}")
    public LeaveRequest requestDocs(
            @PathVariable Long id,
            @RequestParam(required = false) String hrComment) {
        return service.requestDocs(id, hrComment);
    }

    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN', 'HR', 'ROLE_HR')")
    @GetMapping("/insights")
    public java.util.Map<String, Object> getLeaveInsights() {
        return service.getLeaveInsights();
    }
}