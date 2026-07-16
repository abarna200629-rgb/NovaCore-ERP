package com.erp.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.erp.backend.entity.Notification;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByCategoryAndMessage(String category, String message);
    List<Notification> findAllByOrderByCreatedAtDesc();
}
