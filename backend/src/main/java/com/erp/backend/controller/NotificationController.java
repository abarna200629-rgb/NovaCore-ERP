package com.erp.backend.controller;

import java.time.LocalDateTime;
import java.util.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.erp.backend.entity.Notification;
import com.erp.backend.repository.NotificationRepository;
import com.erp.backend.repository.inventory.ProductRepository;
import com.erp.backend.repository.hr.LeaveRepository;
import com.erp.backend.repository.hr.PayrollRepository;
import com.erp.backend.repository.sales.SalesTargetRepository;
import com.erp.backend.repository.finance.ExpenseRepository;
import com.erp.backend.repository.production.ProductionRepository;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin("*")
public class NotificationController {

    @Autowired
    private NotificationRepository repository;

    @Autowired
    private com.erp.backend.repository.EmployeeRepository employeeRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private LeaveRepository leaveRepository;

    @Autowired
    private PayrollRepository payrollRepository;

    @Autowired
    private SalesTargetRepository salesTargetRepository;

    @Autowired
    private ProductionRepository productionRepository;

    @Autowired
    private ExpenseRepository expenseRepository;

    private void syncNotifications() {
        try {
            // 1. Low Stock Alert
            productRepository.findAll().stream()
                .filter(p -> p.getQuantity() != null && p.getQuantity() < 10)
                .forEach(prod -> {
                    String msg = "Product '" + prod.getProductName() + "' is critically low: " + prod.getQuantity() + " remaining.";
                    if (repository.findByCategoryAndMessage("LOW_STOCK", msg).isEmpty()) {
                        Notification n = new Notification();
                        n.setTitle("Low Stock Alert");
                        n.setMessage(msg);
                        n.setCategory("LOW_STOCK");
                        repository.save(n);
                    }
                });

            // 2. Leave Approval
            leaveRepository.findAll().stream()
                .filter(l -> "PENDING".equalsIgnoreCase(l.getStatus()))
                .forEach(leave -> {
                    String msg = "Leave request for Employee ID " + leave.getEmployeeId() + " is pending manager approval.";
                    if (repository.findByCategoryAndMessage("LEAVE_APPROVAL", msg).isEmpty()) {
                        Notification n = new Notification();
                        n.setTitle("Leave Approval Pending");
                        n.setMessage(msg);
                        n.setCategory("LEAVE_APPROVAL");
                        repository.save(n);
                    }
                });

            // 3. Payroll Alert
            long payCount = payrollRepository.count();
            if (payCount > 0) {
                String msg = "Payroll processing: " + payCount + " staff payslip runs logged in active general registry.";
                if (repository.findByCategoryAndMessage("PAYROLL", msg).isEmpty()) {
                    Notification n = new Notification();
                    n.setTitle("Payroll Processed");
                    n.setMessage(msg);
                    n.setCategory("PAYROLL");
                    repository.save(n);
                }
            }

            // 4. Sales Target
            salesTargetRepository.findAll().stream()
                .filter(t -> t.getTargetQuantity() != null && t.getAchievedQuantity() != null && t.getTargetQuantity() > 0)
                .forEach(target -> {
                    double pct = (target.getAchievedQuantity() * 100.0) / target.getTargetQuantity();
                    if (pct < 80.0) {
                        String msg = "Sales Target Warning: " + target.getEmployeeName() + " has completed " 
                                   + String.format("%.1f", pct) + "% of monthly quota.";
                        if (repository.findByCategoryAndMessage("SALES_TARGET", msg).isEmpty()) {
                            Notification n = new Notification();
                            n.setTitle("Sales Target Alert");
                            n.setMessage(msg);
                            n.setCategory("SALES_TARGET");
                            repository.save(n);
                        }
                    }
                });

            // 5. Machine Failure
            productionRepository.findAll().stream()
                .filter(p -> p.getStatus() != null && p.getStatus().contains("FAILED"))
                .forEach(prod -> {
                    String msg = "Machine status warning on production run order ID " + prod.getId();
                    if (repository.findByCategoryAndMessage("MACHINE_FAILURE", msg).isEmpty()) {
                        Notification n = new Notification();
                        n.setTitle("Machine Failure Alert");
                        n.setMessage(msg);
                        n.setCategory("MACHINE_FAILURE");
                        repository.save(n);
                    }
                });

            // 6. Attendance Warning
            long pendingLeaves = leaveRepository.countByStatus("PENDING");
            if (pendingLeaves > 3) {
                String msg = "Workforce Alert: High absenteeism risk detected. " + pendingLeaves + " leaves pending.";
                if (repository.findByCategoryAndMessage("ATTENDANCE", msg).isEmpty()) {
                    Notification n = new Notification();
                    n.setTitle("Attendance Alert");
                    n.setMessage(msg);
                    n.setCategory("ATTENDANCE");
                    repository.save(n);
                }
            }

            // 7. Invoice Due
            expenseRepository.findAll().stream()
                .forEach(exp -> {
                    String msg = "Overhead transaction registered: " + exp.getExpenseName() + " of ₹" + exp.getAmount();
                    if (repository.findByCategoryAndMessage("INVOICE_DUE", msg).isEmpty()) {
                        Notification n = new Notification();
                        n.setTitle("Invoice Logged");
                        n.setMessage(msg);
                        n.setCategory("INVOICE_DUE");
                        repository.save(n);
                    }
                });

        } catch (Exception e) {
            System.err.println("Error syncing notifications: " + e.getMessage());
        }
    }

    @GetMapping
    public List<Notification> getNotifications(org.springframework.security.core.Authentication auth) {
        syncNotifications();
        List<Notification> all = repository.findAllByOrderByCreatedAtDesc();
        if (auth != null) {
            String role = auth.getAuthorities().iterator().next().getAuthority().toUpperCase().replace("ROLE_", "");
            if ("EMPLOYEE".equalsIgnoreCase(role)) {
                com.erp.backend.entity.Employee emp = employeeRepository.findByEmpCode(auth.getName()).orElse(null);
                if (emp != null) {
                    return all.stream()
                        .filter(n -> n.getEmployeeId() != null && n.getEmployeeId().equals(emp.getId()))
                        .collect(Collectors.toList());
                } else {
                    return List.of();
                }
            }
        }
        return all;
    }

    @PutMapping("/{id}/read")
    public Notification markAsRead(@PathVariable Long id) {
        Notification n = repository.findById(id)
            .orElseThrow(() -> new RuntimeException("Notification not found"));
        n.setReadStatus(true);
        return repository.save(n);
    }

    @PutMapping("/mark-all-read")
    public Map<String, Object> markAllAsRead() {
        List<Notification> unread = repository.findAll().stream()
            .filter(n -> !n.isReadStatus())
            .toList();
        for (Notification n : unread) {
            n.setReadStatus(true);
            repository.save(n);
        }
        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("count", unread.size());
        return res;
    }
}
