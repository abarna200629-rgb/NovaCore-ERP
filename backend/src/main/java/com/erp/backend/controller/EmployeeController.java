package com.erp.backend.controller;

import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.erp.backend.entity.Employee;
import com.erp.backend.entity.auth.User;
import com.erp.backend.service.EmployeeService;
import com.erp.backend.repository.EmployeeRepository;
import com.erp.backend.repository.auth.UserRepository;

@RestController
@RequestMapping("/api/employees")
@CrossOrigin(origins = "*")
public class EmployeeController {

    @Autowired
    private EmployeeService service;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private UserRepository userRepository;

    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN', 'HR', 'ROLE_HR')")
    @PostMapping
    public Employee addEmployee(@RequestBody Employee employee) {
        return service.saveEmployee(employee);
    }

    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN', 'HR', 'ROLE_HR', 'SALES', 'ROLE_SALES', 'INVENTORY', 'ROLE_INVENTORY', 'FINANCE', 'ROLE_FINANCE', 'PRODUCTION', 'ROLE_PRODUCTION', 'EMPLOYEE', 'ROLE_EMPLOYEE')")
    @GetMapping
    public List<Employee> getEmployees(
            @RequestParam(required = false) String status,
            org.springframework.security.core.Authentication auth) {
        String role = auth.getAuthorities().iterator().next().getAuthority().toUpperCase().replace("ROLE_", "");
        if ("EMPLOYEE".equalsIgnoreCase(role)) {
            User user = userRepository.findByUsername(auth.getName()).orElse(null);
            Employee emp = null;
            if (user != null && user.getEmployeeId() != null) {
                emp = employeeRepository.findById(user.getEmployeeId()).orElse(null);
            }
            if (emp == null) {
                emp = employeeRepository.findByEmpCode(auth.getName()).orElse(null);
            }
            if (emp != null && "ACTIVE".equalsIgnoreCase(emp.getStatus())) {
                return List.of(emp);
            } else {
                return List.of();
            }
        }

        if (status != null && !status.trim().isEmpty() && !"ALL".equalsIgnoreCase(status)) {
            return employeeRepository.findByStatusIgnoreCase(status.trim());
        }

        if ("ALL".equalsIgnoreCase(status)) {
            return service.getAllEmployees();
        }

        return employeeRepository.findByStatusIgnoreCase("ACTIVE");
    }
   
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN', 'HR', 'ROLE_HR', 'SALES', 'ROLE_SALES', 'INVENTORY', 'ROLE_INVENTORY', 'FINANCE', 'ROLE_FINANCE', 'PRODUCTION', 'ROLE_PRODUCTION', 'EMPLOYEE', 'ROLE_EMPLOYEE')")
    @GetMapping("/{id}")
    public Employee getEmployee(@PathVariable Long id, org.springframework.security.core.Authentication auth) {
        String role = auth.getAuthorities().iterator().next().getAuthority().toUpperCase().replace("ROLE_", "");
        if ("EMPLOYEE".equalsIgnoreCase(role)) {
            User user = userRepository.findByUsername(auth.getName()).orElse(null);
            if (user == null || user.getEmployeeId() == null || !user.getEmployeeId().equals(id)) {
                throw new org.springframework.security.access.AccessDeniedException("Access Denied: You can only view your own profile.");
            }
        }
        return service.getEmployeeById(id);
    }

    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN', 'HR', 'ROLE_HR')")
    @DeleteMapping("/{id}")
    public String deleteEmployee(@PathVariable Long id) {
        service.deleteEmployee(id);
        return "Employee Deleted Successfully";
    }

    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN', 'HR', 'ROLE_HR')")
    @PutMapping("/{id}")
    public Employee updateEmployee(@PathVariable Long id,
                                   @RequestBody Employee employee) {
        return service.updateEmployee(id, employee);
    }

    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN', 'HR', 'ROLE_HR')")
    @PostMapping("/{id}/deactivate")
    public String deactivateEmployee(@PathVariable Long id) {
        service.deactivateEmployee(id);
        return "Employee Deactivated Successfully";
    }

    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN', 'HR', 'ROLE_HR')")
    @PostMapping("/{id}/restore")
    public String restoreEmployee(@PathVariable Long id) {
        service.restoreEmployee(id);
        return "Employee Restored Successfully";
    }
}