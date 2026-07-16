package com.erp.backend.controller.hr;

import java.util.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import com.erp.backend.dto.hr.BurnoutAnalysis;
import com.erp.backend.entity.Employee;
import com.erp.backend.repository.EmployeeRepository;
import com.erp.backend.service.hr.BurnoutService;

@RestController
@RequestMapping("/api/hr/burnout")
@CrossOrigin("*")
public class BurnoutController {

    @Autowired
    private BurnoutService burnoutService;

    @Autowired
    private EmployeeRepository employeeRepository;

    @GetMapping
    public Map<String, Object> getBurnoutDashboard() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        String role = auth.getAuthorities().iterator().next().getAuthority();

        List<BurnoutAnalysis> list = burnoutService.analyzeAll(role, username);

        int total = list.size();
        int low = 0;
        int medium = 0;
        int high = 0;
        int critical = 0;
        double sumScore = 0.0;
        String highestRiskEmp = "N/A";
        int highestScore = -1;

        Map<String, List<Integer>> deptScores = new HashMap<>();

        for (BurnoutAnalysis a : list) {
            sumScore += a.getBurnoutScore();
            String rl = a.getRiskLevel();
            if ("LOW".equals(rl)) low++;
            else if ("MEDIUM".equals(rl)) medium++;
            else if ("HIGH".equals(rl)) high++;
            else if ("CRITICAL".equals(rl)) critical++;

            if (a.getBurnoutScore() > highestScore) {
                highestScore = a.getBurnoutScore();
                highestRiskEmp = a.getEmployeeName() + " (" + a.getBurnoutScore() + " pts)";
            }

            if (a.getDepartment() != null) {
                deptScores.computeIfAbsent(a.getDepartment(), k -> new ArrayList<>()).add(a.getBurnoutScore());
            }
        }

        double averageScore = total > 0 ? (sumScore / total) : 0.0;

        Map<String, Double> deptDistribution = new HashMap<>();
        for (Map.Entry<String, List<Integer>> entry : deptScores.entrySet()) {
            double deptAvg = entry.getValue().stream().mapToInt(Integer::intValue).average().orElse(0.0);
            deptDistribution.put(entry.getKey(), Math.round(deptAvg * 10.0) / 10.0);
        }

        List<BurnoutAnalysis> top10 = list.stream()
                .sorted((a, b) -> b.getBurnoutScore().compareTo(a.getBurnoutScore()))
                .limit(10)
                .toList();

        Map<String, Object> response = new HashMap<>();
        response.put("totalEmployees", total);
        response.put("lowRiskCount", low);
        response.put("mediumRiskCount", medium);
        response.put("highRiskCount", high);
        response.put("criticalRiskCount", critical);
        response.put("averageScore", Math.round(averageScore * 10.0) / 10.0);
        response.put("highestRiskEmployee", highestRiskEmp);
        response.put("departmentBurnoutDistribution", deptDistribution);
        response.put("top10Employees", top10);
        response.put("allEmployees", list);

        return response;
    }

    @GetMapping("/{employeeId}")
    public BurnoutAnalysis getEmployeeBurnout(@PathVariable Long employeeId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        String role = auth.getAuthorities().iterator().next().getAuthority();

        Employee emp = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found with ID: " + employeeId));

        // RBAC validation check for safety
        String cleanRole = role != null ? role.trim().toUpperCase() : "EMPLOYEE";
        String rawRole = cleanRole.startsWith("ROLE_") ? cleanRole.substring(5) : cleanRole;

        if ("EMPLOYEE".equals(rawRole)) {
            if (!emp.getEmpCode().equalsIgnoreCase(username)) {
                throw new RuntimeException("Access Denied: You can only view your own burnout metrics.");
            }
        } else if (!"ADMIN".equals(rawRole) && !"HR".equals(rawRole)) {
            // Department check for managers
            String targetDept = resolveDepartmentFromRole(rawRole);
            if (emp.getDepartment() == null || !emp.getDepartment().equalsIgnoreCase(targetDept)) {
                throw new RuntimeException("Access Denied: You can only view employees within your department.");
            }
        }

        return burnoutService.analyzeEmployee(emp);
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
