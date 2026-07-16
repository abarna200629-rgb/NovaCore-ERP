package com.erp.backend.repository.hr;

import org.springframework.data.jpa.repository.JpaRepository;
import com.erp.backend.entity.hr.Candidate;

public interface CandidateRepository extends JpaRepository<Candidate, Long> {
}
