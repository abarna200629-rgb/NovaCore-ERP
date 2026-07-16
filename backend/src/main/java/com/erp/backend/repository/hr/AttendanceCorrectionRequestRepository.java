package com.erp.backend.repository.hr;

import org.springframework.data.jpa.repository.JpaRepository;
import com.erp.backend.entity.hr.AttendanceCorrectionRequest;
import java.util.List;

public interface AttendanceCorrectionRequestRepository extends JpaRepository<AttendanceCorrectionRequest, Long> {
    List<AttendanceCorrectionRequest> findByEmployeeId(Long employeeId);
}
