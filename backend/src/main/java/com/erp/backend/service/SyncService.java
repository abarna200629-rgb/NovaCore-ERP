package com.erp.backend.service;

import java.util.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import com.erp.backend.entity.Employee;
import com.erp.backend.entity.auth.User;
import com.erp.backend.entity.auth.Role;
import com.erp.backend.repository.EmployeeRepository;
import com.erp.backend.repository.auth.UserRepository;
import com.erp.backend.repository.auth.RoleRepository;
import com.erp.backend.exception.ConflictException;

@Service
public class SyncService {

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private AuditLogService auditLogService;

    private Map<String, Object> cachedReport = new HashMap<>();

    @Transactional
    public Map<String, Object> generateReportAndAutoHeal() {
        List<Employee> allEmployees = employeeRepository.findAll();
        List<User> allUsers = userRepository.findAll();

        // Auto-heal matching by username/empCode
        for (Employee emp : allEmployees) {
            boolean hasLinkedUser = allUsers.stream().anyMatch(u -> emp.getId().equals(u.getEmployeeId()));
            if (!hasLinkedUser) {
                // Find user with matching username = empCode
                Optional<User> matchingUser = allUsers.stream()
                    .filter(u -> u.getUsername() != null && u.getUsername().equalsIgnoreCase(emp.getEmpCode()))
                    .findFirst();
                if (matchingUser.isPresent()) {
                    User u = matchingUser.get();
                    u.setEmployeeId(emp.getId());
                    userRepository.save(u);
                    System.out.println("[SYNC AUTO-HEAL] Linked user " + u.getUsername() + " to employee ID " + emp.getId());
                }
            }
        }

        // Re-fetch users after auto-heal
        allUsers = userRepository.findAll();

        List<Map<String, Object>> unmappedEmployees = new ArrayList<>();
        for (Employee emp : allEmployees) {
            boolean isMapped = allUsers.stream().anyMatch(u -> emp.getId().equals(u.getEmployeeId()));
            if (!isMapped) {
                Map<String, Object> map = new HashMap<>();
                map.put("id", emp.getId());
                map.put("name", emp.getName());
                map.put("empCode", emp.getEmpCode());
                map.put("department", emp.getDepartment());
                map.put("email", emp.getEmail());
                map.put("role", emp.getRole());
                unmappedEmployees.add(map);
            }
        }

        List<Map<String, Object>> unmappedUsers = new ArrayList<>();
        for (User u : allUsers) {
            boolean isMapped = allEmployees.stream().anyMatch(emp -> emp.getId().equals(u.getEmployeeId()));
            if (!isMapped) {
                // Ignore admin account from sync mapping alerts unless desired
                Map<String, Object> map = new HashMap<>();
                map.put("id", u.getId());
                map.put("username", u.getUsername());
                map.put("email", u.getEmail());
                map.put("role", u.getRoleString());
                map.put("status", u.getStatus());
                unmappedUsers.add(map);
            }
        }

        Map<String, Object> report = new HashMap<>();
        report.put("timestamp", new java.util.Date().toString());
        report.put("unmappedEmployees", unmappedEmployees);
        report.put("unmappedUsers", unmappedUsers);
        report.put("status", unmappedEmployees.isEmpty() && unmappedUsers.isEmpty() ? "SYNCHRONIZED" : "MISMATCH");
        
        cachedReport = report;
        return report;
    }

    public Map<String, Object> getCachedReport() {
        if (cachedReport.isEmpty()) {
            return generateReportAndAutoHeal();
        }
        return cachedReport;
    }

    @Transactional
    public void repairMapping(Long employeeId, Long userId) {
        Employee employee = employeeRepository.findById(employeeId)
            .orElseThrow(() -> new ConflictException("Employee not found"));
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ConflictException("User not found"));

        // Validate duplicates
        if (userRepository.findByEmployeeId(employeeId).isPresent()) {
            throw new ConflictException("This employee already has a linked user account.");
        }
        if (user.getEmployeeId() != null) {
            throw new ConflictException("This user is already mapped to another employee.");
        }

        user.setEmployeeId(employee.getId());
        userRepository.save(user);

        auditLogService.saveLog("ADMIN", "Repaired mapping: Linked user " + user.getUsername() + " to employee " + employee.getName(), "HR");
        generateReportAndAutoHeal();
    }

    @Transactional
    public void createNewUserForEmployee(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
            .orElseThrow(() -> new ConflictException("Employee not found"));

        if (userRepository.findByEmployeeId(employeeId).isPresent()) {
            throw new ConflictException("This employee already has a linked user account.");
        }

        if (userRepository.findByUsername(employee.getEmpCode()).isPresent()) {
            throw new ConflictException("Username " + employee.getEmpCode() + " already exists.");
        }

        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String tempPassword = "TempPassword123!"; // Simple default temporary password
        String hashedPassword = encoder.encode(tempPassword);

        String roleName = employee.getRole() != null ? employee.getRole().toUpperCase() : "EMPLOYEE";
        Role userRole = roleRepository.findByRoleName(roleName).orElse(null);
        if (userRole == null) {
            userRole = roleRepository.findByRoleName("EMPLOYEE").orElse(null);
        }

        User user = new User();
        user.setUsername(employee.getEmpCode());
        user.setPassword(hashedPassword);
        user.setEmail(employee.getEmail());
        user.setRole(userRole);
        user.setFirstLogin(true);
        user.setEmployeeId(employee.getId());
        user.setStatus("ACTIVE");
        userRepository.save(user);

        auditLogService.saveLog("ADMIN", "Created new user " + user.getUsername() + " for employee " + employee.getName(), "HR");
        generateReportAndAutoHeal();
    }
}
