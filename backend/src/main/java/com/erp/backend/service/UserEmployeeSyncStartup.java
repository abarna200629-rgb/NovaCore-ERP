package com.erp.backend.service;

import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class UserEmployeeSyncStartup implements CommandLineRunner {

    @Autowired
    private SyncService syncService;

    @Override
    public void run(String... args) throws Exception {
        System.out.println("\n====================================================");
        System.out.println("NOVACORE ERP: INITIALIZING USER-EMPLOYEE SYNC AUDIT");
        System.out.println("====================================================");
        
        try {
            Map<String, Object> report = syncService.generateReportAndAutoHeal();
            System.out.println("Sync Status: " + report.get("status"));
            System.out.println("Unmapped Employees detected: " + ((java.util.List<?>) report.get("unmappedEmployees")).size());
            System.out.println("Unmapped Users detected: " + ((java.util.List<?>) report.get("unmappedUsers")).size());
            System.out.println("Auto-heal complete. Ready for manual repair overrides.");
        } catch (Exception e) {
            System.err.println("Audit check failed: " + e.getMessage());
        }
        System.out.println("====================================================\n");
    }
}
