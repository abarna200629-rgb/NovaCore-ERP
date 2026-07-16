package com.erp.backend.service.hr;

import java.time.LocalDate;
import java.util.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.erp.backend.dto.hr.BurnoutAnalysis;
import com.erp.backend.entity.Employee;
import com.erp.backend.entity.hr.Attendance;
import com.erp.backend.entity.hr.LeaveRequest;
import com.erp.backend.entity.task.Task;
import com.erp.backend.repository.EmployeeRepository;
import com.erp.backend.repository.hr.AttendanceRepository;
import com.erp.backend.repository.hr.LeaveRepository;
import com.erp.backend.repository.task.TaskRepository;

@Service
public class BurnoutService {

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private LeaveRepository leaveRepository;

    @Autowired
    private TaskRepository taskRepository;

    public BurnoutAnalysis analyzeEmployee(Employee employee) {
        BurnoutAnalysis analysis = new BurnoutAnalysis();
        analysis.setEmployeeId(employee.getId());
        analysis.setEmployeeName(employee.getName());
        analysis.setEmpCode(employee.getEmpCode());
        analysis.setDepartment(employee.getDepartment());

        // 1. Fetch Attendance Logs
        List<Attendance> attendances = attendanceRepository.findByEmployeeId(employee.getId());
        
        double attendanceRate = 100.0;
        int lateCheckIns = 0;
        int absentDays = 0;
        double overtimeHours = 0.0;
        double totalHours = 0.0;
        int hourLogsCount = 0;
        List<LocalDate> workDates = new ArrayList<>();

        if (attendances != null && !attendances.isEmpty()) {
            int activeDays = 0;
            int totalDays = attendances.size();
            for (Attendance a : attendances) {
                String status = a.getStatus() != null ? a.getStatus().toUpperCase() : "PRESENT";
                if ("PRESENT".equalsIgnoreCase(status) || "LATE".equalsIgnoreCase(status) || "HALF DAY".equalsIgnoreCase(status) || "HALF_DAY".equalsIgnoreCase(status)) {
                    activeDays++;
                    if (!"ABSENT".equalsIgnoreCase(status)) {
                        try {
                            if (a.getDate() != null) {
                                workDates.add(LocalDate.parse(a.getDate()));
                            }
                        } catch (Exception e) {
                            // Skip parse error dates
                        }
                    }
                }
                
                if ("LATE".equalsIgnoreCase(status)) {
                    lateCheckIns++;
                }
                if ("ABSENT".equalsIgnoreCase(status)) {
                    absentDays++;
                }
                
                if (a.getWorkingHours() != null) {
                    double hrs = a.getWorkingHours();
                    totalHours += hrs;
                    hourLogsCount++;
                    if (hrs > 8.0) {
                        overtimeHours += (hrs - 8.0);
                    }
                }
            }
            if (totalDays > 0) {
                attendanceRate = (activeDays * 100.0) / totalDays;
            }
        }

        // Calculate consecutive working days streak
        int consecutiveDays = 0;
        if (!workDates.isEmpty()) {
            Collections.sort(workDates);
            int maxStreak = 0;
            int currentStreak = 0;
            LocalDate prevDate = null;
            for (LocalDate d : workDates) {
                if (prevDate == null) {
                    currentStreak = 1;
                } else if (d.equals(prevDate.plusDays(1))) {
                    currentStreak++;
                } else if (!d.equals(prevDate)) {
                    currentStreak = 1;
                }
                if (currentStreak > maxStreak) {
                    maxStreak = currentStreak;
                }
                prevDate = d;
            }
            consecutiveDays = maxStreak;
        }

        double averageWorkingHours = hourLogsCount > 0 ? (totalHours / hourLogsCount) : 8.0;

        // 2. Fetch Leaves
        List<LeaveRequest> leaves = leaveRepository.findAll().stream()
                .filter(l -> l.getEmployeeId() != null && l.getEmployeeId().equals(employee.getId()))
                .toList();
        
        int leavesTaken = 0;
        if (leaves != null) {
            leavesTaken = (int) leaves.stream()
                    .filter(l -> "APPROVED".equalsIgnoreCase(l.getStatus()))
                    .count();
        }

        // 3. Fetch Pending Tasks
        List<Task> tasks = taskRepository.findByEmployeeId(employee.getId());
        int pendingTasks = 0;
        if (tasks != null) {
            pendingTasks = (int) tasks.stream()
                    .filter(t -> t.getStatus() == null || !"COMPLETED".equalsIgnoreCase(t.getStatus()))
                    .count();
        }

        // 4. Score Calculation Algorithm
        int score = 0;

        // Attendance Percentage Factor
        if (attendanceRate < 80.0) {
            score += 20;
        } else if (attendanceRate < 90.0) {
            score += 10;
        }

        // Late Arrivals Factor
        if (lateCheckIns > 5) {
            score += 15;
        } else if (lateCheckIns > 2) {
            score += 8;
        }

        // Consecutive Streaks Factor
        if (consecutiveDays > 21) {
            score += 15;
        } else if (consecutiveDays > 10) {
            score += 7;
        }

        // Overtime Hours Factor
        if (overtimeHours > 20.0) {
            score += 20;
        } else if (overtimeHours > 10.0) {
            score += 10;
        }

        // Frequent Leave requests combined with overtime (Stress indicator)
        if (leavesTaken > 2 && overtimeHours > 5.0) {
            score += 10;
        }

        // Pending Workload Tasks Count
        if (pendingTasks > 4) {
            score += 10;
        } else if (pendingTasks > 2) {
            score += 5;
        }

        // High Average Working Hours
        if (averageWorkingHours > 9.5) {
            score += 10;
        }

        // Cap score
        score = Math.max(0, Math.min(100, score));

        // Define Risk Levels
        String riskLevel;
        String recommendation;

        if (score <= 30) {
            riskLevel = "LOW";
            recommendation = "Employee is healthy. Workload is well balanced.";
        } else if (score <= 60) {
            riskLevel = "MEDIUM";
            recommendation = "Monitor workload. Suggest light tasks next week and check for potential burnout markers.";
        } else if (score <= 80) {
            riskLevel = "HIGH";
            recommendation = "Reduce workload. Schedule a one-on-one wellness meeting immediately and review active responsibilities.";
        } else {
            riskLevel = "CRITICAL";
            recommendation = "Immediate HR intervention recommended. Consider leave approval. Assign backup resources to relieve pressure.";
        }

        // Apply DTO details
        analysis.setAttendanceRate(Math.round(attendanceRate * 10.0) / 10.0);
        analysis.setLateCheckIns(lateCheckIns);
        analysis.setLeavesTaken(leavesTaken);
        analysis.setConsecutiveDays(consecutiveDays);
        analysis.setOvertimeHours(Math.round(overtimeHours * 10.0) / 10.0);
        analysis.setAbsentDays(absentDays);
        analysis.setAverageWorkingHours(Math.round(averageWorkingHours * 10.0) / 10.0);
        analysis.setPendingTasks(pendingTasks);
        analysis.setBurnoutScore(score);
        analysis.setRiskLevel(riskLevel);
        analysis.setRecommendation(recommendation);

        return analysis;
    }

    public List<BurnoutAnalysis> analyzeAll(String currentUserRole, String currentUsername) {
        List<Employee> employees = employeeRepository.findAll();
        List<BurnoutAnalysis> list = new ArrayList<>();

        // Resolve access limits based on RBAC roles
        String cleanRole = currentUserRole != null ? currentUserRole.trim().toUpperCase() : "EMPLOYEE";
        String rawRole = cleanRole.startsWith("ROLE_") ? cleanRole.substring(5) : cleanRole;

        if ("ADMIN".equals(rawRole) || "HR".equals(rawRole)) {
            // Full Access
            for (Employee e : employees) {
                list.add(analyzeEmployee(e));
            }
        } else if ("EMPLOYEE".equals(rawRole)) {
            // Only current user (by matching empCode)
            Optional<Employee> currentOpt = employeeRepository.findByEmpCode(currentUsername);
            if (currentOpt.isPresent()) {
                list.add(analyzeEmployee(currentOpt.get()));
            }
        } else {
            // Department Managers (FINANCE, SALES, PRODUCTION, INVENTORY etc.)
            // Resolve mapping of roles to employee departments
            String targetDept = resolveDepartmentFromRole(rawRole);
            for (Employee e : employees) {
                if (e.getDepartment() != null && e.getDepartment().equalsIgnoreCase(targetDept)) {
                    list.add(analyzeEmployee(e));
                }
            }
        }

        // Sort descending by score
        list.sort((a, b) -> b.getBurnoutScore().compareTo(a.getBurnoutScore()));
        return list;
    }

    private String resolveDepartmentFromRole(String role) {
        if ("SALES".equalsIgnoreCase(role)) return "Sales";
        if ("PRODUCTION".equalsIgnoreCase(role) || "MANUFACTURING".equalsIgnoreCase(role)) return "Production";
        if ("INVENTORY".equalsIgnoreCase(role) || "WAREHOUSE".equalsIgnoreCase(role)) return "Inventory";
        if ("FINANCE".equalsIgnoreCase(role) || "ACCOUNTS".equalsIgnoreCase(role)) return "Finance";
        if ("HR".equalsIgnoreCase(role)) return "HR";
        return role;
    }
}
