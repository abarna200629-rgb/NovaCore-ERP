package com.erp.backend.service;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import com.erp.backend.entity.AuditLog;
import com.erp.backend.repository.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;

@Service
public class AuditLogService {

    @Autowired
    private AuditLogRepository repository;

    @Autowired
    private HttpServletRequest request;

    public void saveLog(String username, String action, String module) {
        AuditLog log = new AuditLog();

        // Automatically resolve current authenticated user and role if possible
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String resolvedUser = username;
        String resolvedRole = "UNKNOWN";

        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
            resolvedUser = auth.getName();
            if (!auth.getAuthorities().isEmpty()) {
                resolvedRole = auth.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "");
            }
        } else if (username == null || username.trim().isEmpty()) {
            resolvedUser = "SYSTEM";
        }

        log.setUsername(resolvedUser);
        log.setRole(resolvedRole);
        log.setAction(action);
        log.setModuleName(module);

        // Automatically resolve remote IP address
        String ipAddress = request.getHeader("X-Forwarded-For");
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getRemoteAddr();
        }
        log.setIpAddress(ipAddress);

        repository.save(log);
    }

    private List<AuditLog> filterLogsByRole(List<AuditLog> logs) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            return new java.util.ArrayList<>();
        }
        String username = auth.getName();
        String role = "EMPLOYEE";
        if (!auth.getAuthorities().isEmpty()) {
            role = auth.getAuthorities().iterator().next().getAuthority().toUpperCase().replace("ROLE_", "");
        }

        if ("ADMIN".equals(role)) {
            return logs;
        }

        final String finalRole = role;
        return logs.stream().filter(log -> {
            if ("HR".equals(finalRole)) {
                return "HR".equalsIgnoreCase(log.getModuleName());
            } else if ("INVENTORY".equals(finalRole)) {
                return "INVENTORY".equalsIgnoreCase(log.getModuleName()) || "Products".equalsIgnoreCase(log.getModuleName());
            } else if ("SALES".equals(finalRole)) {
                return "SALES".equalsIgnoreCase(log.getModuleName()) || "CRM".equalsIgnoreCase(log.getModuleName()) || "Customers".equalsIgnoreCase(log.getModuleName());
            } else if ("FINANCE".equals(finalRole)) {
                return "FINANCE".equalsIgnoreCase(log.getModuleName()) || "Finance".equalsIgnoreCase(log.getModuleName());
            } else {
                return username.equalsIgnoreCase(log.getUsername());
            }
        }).collect(java.util.stream.Collectors.toList());
    }

    public List<AuditLog> getAllLogs() {
        return filterLogsByRole(repository.findAll());
    }

    public List<AuditLog> getRecentLogs() {
        List<AuditLog> allSorted = repository.findAll(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "actionTime"));
        List<AuditLog> filtered = filterLogsByRole(allSorted);
        if (filtered.size() > 10) {
            return filtered.subList(0, 10);
        }
        return filtered;
    }
}