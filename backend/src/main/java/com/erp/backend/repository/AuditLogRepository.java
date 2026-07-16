package com.erp.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.erp.backend.entity.AuditLog;

public interface AuditLogRepository
        extends JpaRepository<AuditLog, Long> {

    java.util.List<AuditLog> findTop10ByOrderByActionTimeDesc();
}