package com.erp.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;

    private String action;

    private String moduleName;

    private LocalDateTime actionTime;

    private String role;

    private String ipAddress;

    public AuditLog() {

        this.actionTime =
                LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(
            String username) {

        this.username = username;
    }

    public String getAction() {
        return action;
    }

    public void setAction(
            String action) {

        this.action = action;
    }

    public String getModuleName() {
        return moduleName;
    }

    public void setModuleName(
            String moduleName) {

        this.moduleName = moduleName;
    }

    public LocalDateTime getActionTime() {
        return actionTime;
    }

    public void setActionTime(
            LocalDateTime actionTime) {

        this.actionTime = actionTime;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }
}