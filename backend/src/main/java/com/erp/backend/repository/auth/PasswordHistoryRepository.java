package com.erp.backend.repository.auth;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.erp.backend.entity.auth.PasswordHistory;

@Repository
public interface PasswordHistoryRepository extends JpaRepository<PasswordHistory, Long> {
    List<PasswordHistory> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<PasswordHistory> findByUserIdOrderByCreatedAtAsc(Long userId);
}
