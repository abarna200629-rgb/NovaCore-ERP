package com.erp.backend.repository.hr;

import org.springframework.data.jpa.repository.JpaRepository;

import com.erp.backend.entity.hr.LeaveRequest;

public interface LeaveRepository
        extends JpaRepository<LeaveRequest, Long> {

    Long countByStatus(String status);

}