package com.erp.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HrController {

    @GetMapping("/api/hr/dashboard")
    public String hrDashboard() {
        return "Welcome HR";
    }
}