package com.erp.backend.controller;

import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.ArrayList;

@RestController
@CrossOrigin("*")
public class AdminController {

    public static class NotificationItem {
        private Long id;
        private String type;
        private String message;

        public NotificationItem() {}
        public NotificationItem(Long id, String type, String message) {
            this.id = id;
            this.type = type;
            this.message = message;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }

    private static final List<NotificationItem> notifications = new ArrayList<>();

    static {
        notifications.add(new NotificationItem(1L, "SYSTEM", "Welcome to ERP Core PRO!"));
        notifications.add(new NotificationItem(2L, "INVENTORY", "Low stock alert: Silicon Wafer is below threshold."));
        notifications.add(new NotificationItem(3L, "PRODUCTION", "Machine status updated for Order #4."));
    }

    public static void addNotification(String type, String message) {
        synchronized (notifications) {
            long newId = notifications.isEmpty() ? 1L : notifications.get(notifications.size() - 1).getId() + 1;
            notifications.add(new NotificationItem(newId, type, message));
        }
    }

    @GetMapping("/api/admin/dashboard")
    public String adminDashboard() {
        return "Welcome ADMIN";
    }

    @GetMapping("/api/notifications/unread")
    public List<NotificationItem> getUnreadNotifications() {
        return notifications;
    }

    @PutMapping("/api/notifications/read-all")
    public String readAllNotifications() {
        notifications.clear();
        return "All Notifications Marked Read";
    }
}