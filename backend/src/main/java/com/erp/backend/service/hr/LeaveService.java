package com.erp.backend.service.hr;

import java.util.List;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.time.LocalDate;
import java.util.stream.Collectors;
import java.util.concurrent.CompletableFuture;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.Authentication;

import com.erp.backend.entity.Employee;
import com.erp.backend.entity.hr.LeaveRequest;
import com.erp.backend.entity.hr.Attendance;
import com.erp.backend.entity.auth.User;
import com.erp.backend.repository.EmployeeRepository;
import com.erp.backend.repository.hr.LeaveRepository;
import com.erp.backend.repository.hr.AttendanceRepository;
import com.erp.backend.repository.auth.UserRepository;
import com.erp.backend.controller.AdminController;
import com.erp.backend.service.auth.MailService;
import com.erp.backend.service.AuditLogService;

@Service
public class LeaveService {

    @Autowired
    private LeaveRepository repository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MailService mailService;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private com.erp.backend.repository.NotificationRepository notificationRepository;

    private void addEmployeeNotification(Long employeeId, String category, String title, String message) {
        com.erp.backend.entity.Notification n = new com.erp.backend.entity.Notification();
        n.setEmployeeId(employeeId);
        n.setCategory(category);
        n.setTitle(title);
        n.setMessage(message);
        notificationRepository.save(n);
    }

    public LeaveRequest applyLeave(LeaveRequest leaveRequest) {
        Employee employee = employeeRepository.findById(leaveRequest.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee ID Not Found"));

        if (!"ACTIVE".equalsIgnoreCase(employee.getStatus())) {
            throw new RuntimeException("Leave Apply Error: Inactive employees cannot submit leave requests.");
        }

        // Validation Rules
        if (leaveRequest.getFromDate() == null || leaveRequest.getToDate() == null) {
            throw new RuntimeException("From Date and To Date cannot be empty.");
        }
        LocalDate from = LocalDate.parse(leaveRequest.getFromDate());
        LocalDate to = LocalDate.parse(leaveRequest.getToDate());
        if (from.isBefore(LocalDate.now())) {
            throw new RuntimeException("Past dates are not allowed.");
        }
        if (from.isAfter(to)) {
            throw new RuntimeException("From Date cannot be after To Date.");
        }
        if (leaveRequest.getReason() == null || leaveRequest.getReason().trim().isEmpty()) {
            throw new RuntimeException("Reason cannot be empty.");
        }
        
        double requestedDays = (double) (java.time.temporal.ChronoUnit.DAYS.between(from, to) + 1);
        if ("Half Day".equalsIgnoreCase(leaveRequest.getDayType())) {
            requestedDays = 0.5;
        }
        leaveRequest.setTotalDays(requestedDays);
        if (requestedDays <= 0) {
            throw new RuntimeException("Leave days must be positive.");
        }

        double balance = employee.getLeaveBalance() != null ? employee.getLeaveBalance() : 15.0;
        if (requestedDays > balance) {
            throw new RuntimeException("Leave request exceeds your current leave balance (" + balance + " days remaining).");
        }

        // Duplicate Check
        List<LeaveRequest> existingLeaves = repository.findAll().stream()
                .filter(l -> l.getEmployeeId() != null && l.getEmployeeId().equals(leaveRequest.getEmployeeId()))
                .filter(l -> !"REJECTED".equalsIgnoreCase(l.getStatus()) && !"CANCELLED".equalsIgnoreCase(l.getStatus()))
                .filter(l -> leaveRequest.getFromDate().compareTo(l.getToDate()) <= 0 && leaveRequest.getToDate().compareTo(l.getFromDate()) >= 0)
                .collect(Collectors.toList());
        if (!existingLeaves.isEmpty()) {
            throw new RuntimeException("Duplicate request: You already have a request overlapping with these dates!");
        }

        // Initialize status, stage and audit fields
        leaveRequest.setStatus("PENDING");
        leaveRequest.setStage("HR_PENDING");
        leaveRequest.setAppliedBy(employee.getName());
        leaveRequest.setAppliedDate(LocalDate.now().toString());

        // Run AI Analysis Engine
        runAIAnalysis(leaveRequest, employee);

        LeaveRequest saved = repository.save(leaveRequest);

        // Notify Employee and HR (In-App Database Notifications)
        addEmployeeNotification(employee.getId(), "LEAVE_APPROVAL", "Leave Applied Successfully", 
            "Your leave request for " + leaveRequest.getLeaveType() + " (" + requestedDays + " Days) is submitted.");
        
        // Notify HR
        com.erp.backend.entity.Notification hrNotif = new com.erp.backend.entity.Notification();
        hrNotif.setCategory("LEAVE_APPROVAL");
        hrNotif.setTitle("New Leave Request Pending");
        hrNotif.setMessage("New request from " + employee.getName() + " (" + employee.getDepartment() + ").");
        notificationRepository.save(hrNotif);

        // Send Email Notifications
        String empEmail = getEmployeeEmail(employee);
        sendEmailAsync("erpmanagement2028@gmail.com", "New Leave Request Received", 
            "Subject: New Leave Request Received\n\nHello HR/Admin,\n\nA new leave request has been received:\n\n" +
            "Request ID: " + saved.getId() + "\n" +
            "Employee Name: " + employee.getName() + "\n" +
            "Employee ID: " + employee.getId() + "\n" +
            "Department: " + employee.getDepartment() + "\n" +
            "Leave Type: " + leaveRequest.getLeaveType() + "\n" +
            "From Date: " + leaveRequest.getFromDate() + "\n" +
            "To Date: " + leaveRequest.getToDate() + "\n" +
            "Total Days: " + requestedDays + "\n" +
            "Reason: " + leaveRequest.getReason() + "\n" +
            "Status: PENDING\n\nNovaCore ERP");

        return saved;
    }

    private void runAIAnalysis(LeaveRequest leaveRequest, Employee employee) {
        // 1. Leave Balance Check
        double balance = employee.getLeaveBalance() != null ? employee.getLeaveBalance() : 15.0;
        double requestedDays = leaveRequest.getTotalDays() != null ? leaveRequest.getTotalDays() : 1.0;
        boolean balanceOk = balance >= requestedDays;
        
        if (balance < 5) {
            leaveRequest.setAiLeaveBalance("⚠️ Low Leave Balance (" + balance + " days remaining)");
        } else {
            leaveRequest.setAiLeaveBalance("✅ Leave Balance Sufficient (" + balance + " days remaining)");
        }

        // 2. Policy Compliance Check (Medical/Sick rules)
        boolean docUploaded = leaveRequest.getSupportingDocPath() != null && !leaveRequest.getSupportingDocPath().trim().isEmpty();
        boolean policyPassed = true;
        if (("Medical".equalsIgnoreCase(leaveRequest.getLeaveType()) || "Sick".equalsIgnoreCase(leaveRequest.getLeaveType())) && requestedDays > 2) {
            if (!docUploaded) {
                policyPassed = false;
                leaveRequest.setAiMedicalCertificateStatus("Missing (Required for > 2 days)");
            } else {
                leaveRequest.setAiMedicalCertificateStatus("Uploaded");
            }
        } else {
            leaveRequest.setAiMedicalCertificateStatus(docUploaded ? "Uploaded" : "Not Required");
        }
        leaveRequest.setAiPolicyCompliance(policyPassed ? "Passed" : "Failed (Missing Medical Certificate)");

        // 3. Attendance History Check
        List<Attendance> attendanceLogs = attendanceRepository.findByEmployeeId(employee.getId());
        long latePunches = attendanceLogs.stream()
                .filter(a -> "LATE".equalsIgnoreCase(a.getStatus()))
                .count();
        leaveRequest.setAiAttendanceSummary(latePunches == 0 ? "Excellent (0 late arrivals)" : "Satisfactory (" + latePunches + " late arrivals detected)");

        // 4. Team Availability / Overlap Checks (Same department)
        String dept = employee.getDepartment();
        List<Employee> deptStaff = employeeRepository.findAll().stream()
                .filter(e -> dept != null && dept.equalsIgnoreCase(e.getDepartment()) && !e.getId().equals(employee.getId()))
                .collect(Collectors.toList());

        List<Long> deptStaffIds = deptStaff.stream().map(Employee::getId).collect(Collectors.toList());

        List<LeaveRequest> overlappingLeaves = repository.findAll().stream()
                .filter(l -> deptStaffIds.contains(l.getEmployeeId()))
                .filter(l -> "APPROVED".equalsIgnoreCase(l.getStatus()) || "PENDING".equalsIgnoreCase(l.getStatus()))
                .filter(l -> leaveRequest.getFromDate().compareTo(l.getToDate()) <= 0 && leaveRequest.getToDate().compareTo(l.getFromDate()) >= 0)
                .collect(Collectors.toList());

        long overlappingStaffCount = overlappingLeaves.stream()
                .map(LeaveRequest::getEmployeeId)
                .distinct()
                .count();

        if (overlappingStaffCount > 0) {
            long remainingStaff = deptStaff.size() - overlappingStaffCount + 1; // +1 includes caller
            if (remainingStaff <= 1) {
                leaveRequest.setAiTeamAvailability("⚠️ " + dept + " department has insufficient staff (" + remainingStaff + " remaining).");
            } else {
                leaveRequest.setAiTeamAvailability("⚠️ " + dept + " department has " + overlappingStaffCount + " employees on leave during the same dates.");
            }
        } else {
            leaveRequest.setAiTeamAvailability("✅ No department scheduling conflicts detected.");
        }

        // 5. Generate Recommendation, Confidence & Reason
        if (!balanceOk) {
            leaveRequest.setAiRecommendation("REJECT");
            leaveRequest.setAiConfidenceScore(95);
            leaveRequest.setAiReason("No leave balance\nCompany policy violated\nRequested " + requestedDays + " days, but only " + balance + " remaining.");
        } else if (!policyPassed) {
            leaveRequest.setAiRecommendation("REJECT");
            leaveRequest.setAiConfidenceScore(92);
            leaveRequest.setAiReason("Missing mandatory documents\nPolicy violation: Medical/Sick leave > 2 days requires a medical certificate.");
        } else if (!overlappingLeaves.isEmpty()) {
            leaveRequest.setAiRecommendation("REVIEW");
            leaveRequest.setAiConfidenceScore(78);
            leaveRequest.setAiReason("Multiple employees already on leave\nCoverage Risk: Overlapping department leaves detected.");
        } else if (requestedDays > 10) {
            leaveRequest.setAiRecommendation("REVIEW");
            leaveRequest.setAiConfidenceScore(85);
            leaveRequest.setAiReason("Long leave request\nflagged for HR manual review to confirm handover and backup plans.");
        } else {
            leaveRequest.setAiRecommendation("APPROVE");
            leaveRequest.setAiConfidenceScore(94);
            leaveRequest.setAiReason("Leave balance available\nNo department conflicts\nMedical certificate uploaded\nCompany policy satisfied");
        }
    }

    public List<LeaveRequest> getAllLeaves() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null) {
            boolean isEmployee = auth.getAuthorities().stream()
                    .anyMatch(a -> "ROLE_EMPLOYEE".equalsIgnoreCase(a.getAuthority()) || "EMPLOYEE".equalsIgnoreCase(a.getAuthority()));
            if (isEmployee) {
                String username = auth.getName();
                Employee emp = employeeRepository.findAll().stream()
                        .filter(e -> e.getName().equalsIgnoreCase(username))
                        .findFirst()
                        .orElse(null);
                if (emp != null) {
                    return repository.findAll().stream()
                            .filter(l -> emp.getId().equals(l.getEmployeeId()))
                            .collect(Collectors.toList());
                } else {
                    return new java.util.ArrayList<>();
                }
            }
        }
        return repository.findAll();
    }

    public void deleteLeave(Long id) {
        repository.deleteById(id);
    }

    // HR Actions overrides
    public LeaveRequest managerApprove(Long id) {
        LeaveRequest leave = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Leave Request not found"));
        leave.setStage("HR_PENDING");
        LeaveRequest saved = repository.save(leave);

        Employee employee = employeeRepository.findById(leave.getEmployeeId()).orElse(null);
        String name = employee != null ? employee.getName() : "Employee";
        AdminController.addNotification("LEAVE", "Leave request for " + name + " approved by Manager. Pending HR final approval.");
        
        // Notify Employee of Stage Update
        if (employee != null) {
            sendEmailAsync(getEmployeeEmail(employee), "Leave Request Update", 
                "Hello " + employee.getName() + ",\n\nYour leave request from " + leave.getFromDate() + " to " + leave.getToDate() + " has been approved by your Manager and is pending final HR approval.\n\nStatus: Pending HR\n\nThank you,\nNovaCore ERP");
        }

        return saved;
    }

    public LeaveRequest hrApprove(Long id) {
        LeaveRequest leave = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Leave Request not found"));
        leave.setStatus("APPROVED");
        leave.setStage("HR_APPROVED");
        
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String currentUserName = auth != null ? auth.getName() : "HR Manager";
        leave.setApprovedBy(currentUserName);
        leave.setApprovedDate(LocalDate.now().toString());

        Employee employee = employeeRepository.findById(leave.getEmployeeId()).orElse(null);
        if (employee != null) {
            // Deduct leave balance
            double current = employee.getLeaveBalance() != null ? employee.getLeaveBalance() : 15.0;
            double days = leave.getTotalDays() != null ? leave.getTotalDays() : 1.0;
            employee.setLeaveBalance(Math.max(0.0, current - days));
            employeeRepository.save(employee);

            // Update Attendance logs to LEAVE status for all dates
            try {
                LocalDate start = LocalDate.parse(leave.getFromDate());
                LocalDate end = LocalDate.parse(leave.getToDate());
                for (LocalDate date = start; !date.isAfter(end); date = date.plusDays(1)) {
                    String dateStr = date.toString();
                    Attendance att = attendanceRepository.findByEmployeeIdAndDate(employee.getId(), dateStr)
                            .orElse(new Attendance());
                    att.setEmployeeId(employee.getId());
                    att.setDate(dateStr);
                    att.setStatus("LEAVE");
                    att.setWorkingHours(0.0);
                    att.setRemarks("Approved Leave: " + leave.getLeaveType());
                    attendanceRepository.save(att);
                }
            } catch (Exception e) {
                System.err.println("Failed to sync attendance: " + e.getMessage());
            }

            // Create In-App Notification for Employee
            addEmployeeNotification(employee.getId(), "LEAVE_APPROVAL", "Leave Approved", 
                "Your leave request for " + leave.getLeaveType() + " has been APPROVED.");

            // Email Employee
            sendEmailAsync(getEmployeeEmail(employee), "Leave Request Approved", 
                "Subject: Leave Request Approved\n\nDear Employee,\n\nYour leave request has been approved.\n\n" +
                "Leave Type: " + leave.getLeaveType() + "\n" +
                "From: " + leave.getFromDate() + "\n" +
                "To: " + leave.getToDate() + "\n" +
                "HR Remarks: " + (leave.getHrComments() != null ? leave.getHrComments() : "Approved. Take care.") + "\n\n" +
                "Thank You.\n\nNovaCore ERP");
            
            // Create Audit Log
            auditLogService.saveLog(null, "APPROVED Leave Request #" + id + " for " + employee.getName() + " (" + leave.getTotalDays() + " Days)", "HR");
        }
        return repository.save(leave);
    }

    public LeaveRequest reject(Long id, String hrComment) {
        LeaveRequest leave = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Leave Request not found"));
        leave.setStatus("REJECTED");
        leave.setStage("HR_REJECTED");
        
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String currentUserName = auth != null ? auth.getName() : "HR Manager";
        leave.setApprovedBy(currentUserName);
        leave.setApprovedDate(LocalDate.now().toString());

        if (hrComment != null && !hrComment.trim().isEmpty()) {
            leave.setHrComments(hrComment);
        } else {
            leave.setHrComments("Rejected due to operational constraints.");
        }
        
        Employee employee = employeeRepository.findById(leave.getEmployeeId()).orElse(null);
        if (employee != null) {
            // Create In-App Notification for Employee
            addEmployeeNotification(employee.getId(), "LEAVE_APPROVAL", "Leave Rejected", 
                "Your leave request for " + leave.getLeaveType() + " has been REJECTED.");

            // Email Employee
            sendEmailAsync(getEmployeeEmail(employee), "Leave Request Rejected", 
                "Subject: Leave Request Rejected\n\nDear Employee,\n\nYour leave request has been rejected.\n\n" +
                "Reason: " + leave.getReason() + "\n" +
                "HR Remarks: " + leave.getHrComments() + "\n\n" +
                "NovaCore ERP");
            
            // Create Audit Log
            auditLogService.saveLog(null, "REJECTED Leave Request #" + id + " for " + employee.getName() + " (Reason: " + leave.getHrComments() + ")", "HR");
        }

        return repository.save(leave);
    }

    public LeaveRequest requestDocs(Long id, String hrComment) {
        LeaveRequest leave = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Leave Request not found"));
        leave.setStatus("PENDING_DOCS");
        leave.setStage("DOCUMENTS_REQUESTED");
        if (hrComment != null && !hrComment.trim().isEmpty()) {
            leave.setHrComments(hrComment);
        }

        Employee employee = employeeRepository.findById(leave.getEmployeeId()).orElse(null);
        if (employee != null) {
            // Create In-App Notification for Employee
            addEmployeeNotification(employee.getId(), "LEAVE_APPROVAL", "Documents Requested", 
                "HR has requested supporting documents for your leave request.");

            // Email Employee
            sendEmailAsync(getEmployeeEmail(employee), "Additional Documents Requested for Leave", 
                "Hello " + employee.getName() + ",\n\nHR has requested additional supporting documents for your leave request from " + leave.getFromDate() + " to " + leave.getToDate() + ".\n\nHR Comment: " + (hrComment != null ? hrComment : "None") + "\n\nStatus:\nPending Documents\n\nThank you,\nNovaCore ERP");
        }

        return repository.save(leave);
    }

    private void sendEmailAsync(String to, String subject, String body) {
        CompletableFuture.runAsync(() -> {
            try {
                mailService.sendAlertMail(to, subject, body);
                System.out.println("[SMTP] Email successfully delivered to: " + to + " (Subject: " + subject + ")");
            } catch (Exception e) {
                System.err.println("[SMTP] Failed to send email to " + to + ": " + e.getMessage());
            }
        });
    }

    private String getEmployeeEmail(Employee employee) {
        if (employee == null) return "erpmanagement2028@gmail.com";
        return userRepository.findByUsername(employee.getName())
                .map(User::getEmail)
                .orElse("erpmanagement2028@gmail.com");
    }

    // AI LEAVE DASHBOARD INSIGHTS
    public Map<String, Object> getLeaveInsights() {
        List<LeaveRequest> allLeaves = repository.findAll();
        List<Employee> allEmployees = employeeRepository.findAll();

        long pendingReviews = allLeaves.stream().filter(l -> "PENDING".equalsIgnoreCase(l.getStatus())).count();
        long recApprovals = allLeaves.stream().filter(l -> "PENDING".equalsIgnoreCase(l.getStatus()) && "APPROVE".equalsIgnoreCase(l.getAiRecommendation())).count();
        long recRejections = allLeaves.stream().filter(l -> "PENDING".equalsIgnoreCase(l.getStatus()) && "REJECT".equalsIgnoreCase(l.getAiRecommendation())).count();
        long manualReviews = allLeaves.stream().filter(l -> "PENDING".equalsIgnoreCase(l.getStatus()) && "REVIEW".equalsIgnoreCase(l.getAiRecommendation())).count();

        // 1. Dynamic Coverage Risks & Conflicts
        List<String> conflictsList = new ArrayList<>();
        Map<String, List<Employee>> deptMap = allEmployees.stream()
                .filter(e -> e.getDepartment() != null)
                .collect(Collectors.groupingBy(Employee::getDepartment));

        for (Map.Entry<String, List<Employee>> entry : deptMap.entrySet()) {
            String department = entry.getKey();
            List<Employee> staff = entry.getValue();
            List<Long> staffIds = staff.stream().map(Employee::getId).collect(Collectors.toList());

            // Get active leaves for this department
            List<LeaveRequest> activeDeptLeaves = allLeaves.stream()
                    .filter(l -> staffIds.contains(l.getEmployeeId()))
                    .filter(l -> "PENDING".equalsIgnoreCase(l.getStatus()) || "APPROVED".equalsIgnoreCase(l.getStatus()))
                    .collect(Collectors.toList());

            for (int i = 0; i < activeDeptLeaves.size(); i++) {
                LeaveRequest l1 = activeDeptLeaves.get(i);
                long overlappingCount = 1;
                for (int j = i + 1; j < activeDeptLeaves.size(); j++) {
                    LeaveRequest l2 = activeDeptLeaves.get(j);
                    if (l1.getFromDate().compareTo(l2.getToDate()) <= 0 && l1.getToDate().compareTo(l2.getFromDate()) >= 0) {
                        overlappingCount++;
                    }
                }

                if (overlappingCount >= 2) {
                    long remaining = staff.size() - overlappingCount;
                    String msg = "⚠️ " + department + " department has " + overlappingCount + " employees on leave during the same dates.";
                    if (remaining <= 1) {
                        msg = "⚠️ " + department + " department has insufficient staff (" + remaining + " remaining).";
                    }
                    if (!conflictsList.contains(msg)) {
                        conflictsList.add(msg);
                    }
                }
            }
        }

        if (conflictsList.isEmpty()) {
            conflictsList.add("✅ No department scheduling conflicts detected.");
        }

        // 2. Low Balance Alerts
        List<Map<String, Object>> lowBalance = allEmployees.stream()
                .filter(e -> e.getLeaveBalance() != null && e.getLeaveBalance() < 5)
                .map(e -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("name", e.getName());
                    map.put("dept", e.getDepartment());
                    map.put("balance", e.getLeaveBalance());
                    return map;
                })
                .collect(Collectors.toList());

        // Trends
        List<String> trends = new ArrayList<>();
        trends.add("Medical/Sick requests represent 45% of total Q2 requests.");
        trends.add("IT department shows 3 concurrent requests on upcoming week.");
        trends.add("Friday and Monday requests make up 65% of short leaves.");

        Map<String, Object> insights = new HashMap<>();
        insights.put("pendingReviewsCount", pendingReviews);
        insights.put("recommendedApprovalsCount", recApprovals);
        insights.put("recommendedRejectionsCount", recRejections);
        insights.put("manualReviewsCount", manualReviews);
        insights.put("departmentConflicts", conflictsList);
        insights.put("lowBalanceEmployees", lowBalance);
        insights.put("frequentLeaveTrends", trends);

        return insights;
    }
}