package com.erp.backend.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.erp.backend.entity.AuditLog;
import com.erp.backend.service.AuditLogService;

@RestController
@RequestMapping({"/api/audit-logs", "/api/audit"})
@CrossOrigin("*")
public class AuditLogController {

    @Autowired
    private AuditLogService service;

    @GetMapping
    public List<AuditLog> getLogs() {

        return service.getAllLogs();
    }

    @GetMapping("/recent")
    public List<AuditLog> getRecentLogs() {
        return service.getRecentLogs();
    }
}