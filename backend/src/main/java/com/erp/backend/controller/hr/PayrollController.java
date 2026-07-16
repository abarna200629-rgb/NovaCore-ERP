package com.erp.backend.controller.hr;

import java.util.List;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;

import com.erp.backend.entity.Employee;
import com.erp.backend.entity.hr.Payroll;
import com.erp.backend.repository.EmployeeRepository;
import com.erp.backend.service.hr.PayrollService;

@RestController
@RequestMapping("/api/hr/payroll")
@CrossOrigin("*")
public class PayrollController {

    @Autowired
    private PayrollService service;

    @Autowired
    private EmployeeRepository employeeRepository;

    @PostMapping
    public Payroll addPayroll(
            @RequestBody Payroll payroll) {

        return service.savePayroll(payroll);
    }

    @GetMapping
    public List<Payroll> getPayroll(Authentication auth) {
        String role = auth.getAuthorities().iterator().next().getAuthority().toUpperCase().replace("ROLE_", "");
        if ("EMPLOYEE".equalsIgnoreCase(role)) {
            Employee emp = employeeRepository.findByEmpCode(auth.getName()).orElse(null);
            if (emp != null) {
                return service.getAllPayroll().stream()
                        .filter(p -> p.getEmployeeId() != null && p.getEmployeeId().equals(emp.getId()))
                        .collect(Collectors.toList());
            } else {
                return List.of();
            }
        }
        return service.getAllPayroll();
    }

    @GetMapping("/employee/{id}")
    public Employee getEmployee(
            @PathVariable Long id){

        return service.getEmployee(id);
    }

    @DeleteMapping("/{id}")
    public String deletePayroll(
            @PathVariable Long id) {

        service.deletePayroll(id);

        return "Payroll Deleted Successfully";
    }
}