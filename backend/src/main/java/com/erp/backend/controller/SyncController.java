package com.erp.backend.controller;

import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import com.erp.backend.service.SyncService;

@RestController
@RequestMapping("/api/sync")
@CrossOrigin("*")
@PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN', 'HR', 'ROLE_HR')")
public class SyncController {

    @Autowired
    private SyncService syncService;

    @GetMapping("/report")
    public Map<String, Object> getReport() {
        return syncService.generateReportAndAutoHeal();
    }

    @PostMapping("/repair")
    public String repairMapping(@RequestBody Map<String, Long> payload) {
        Long employeeId = payload.get("employeeId");
        Long userId = payload.get("userId");
        if (employeeId == null || userId == null) {
            throw new IllegalArgumentException("employeeId and userId are required");
        }
        syncService.repairMapping(employeeId, userId);
        return "Mapping Repaired Successfully";
    }

    @PostMapping("/create-user")
    public String createUser(@RequestBody Map<String, Long> payload) {
        Long employeeId = payload.get("employeeId");
        if (employeeId == null) {
            throw new IllegalArgumentException("employeeId is required");
        }
        syncService.createNewUserForEmployee(employeeId);
        return "User Created Successfully";
    }
}
