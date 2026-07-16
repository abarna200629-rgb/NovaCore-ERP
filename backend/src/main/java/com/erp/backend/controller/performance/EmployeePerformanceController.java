package com.erp.backend.controller.performance;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.erp.backend.entity.performance.EmployeePerformance;
import com.erp.backend.service.performance.EmployeePerformanceService;

@RestController
@RequestMapping({"/api/performance", "/api/hr/performance"})
@CrossOrigin("*")
public class EmployeePerformanceController {

    @Autowired
    private EmployeePerformanceService service;

    @PostMapping
    public EmployeePerformance savePerformance(
            @RequestBody EmployeePerformance performance) {

        return service.savePerformance(performance);
    }

    @GetMapping
    public List<EmployeePerformance> getPerformance() {

        return service.getAllPerformance();
    }

    @DeleteMapping("/{id}")
    public String deletePerformance(
            @PathVariable Long id) {

        service.deletePerformance(id);

        return "Performance Deleted";
    }
}