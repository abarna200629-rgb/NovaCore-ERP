package com.erp.backend.service;

import java.util.List;
import java.security.SecureRandom;
import java.util.concurrent.CompletableFuture;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import org.springframework.transaction.annotation.Transactional;
import com.erp.backend.entity.Employee;
import com.erp.backend.entity.auth.User;
import com.erp.backend.entity.auth.Role;
import com.erp.backend.repository.EmployeeRepository;
import com.erp.backend.repository.auth.UserRepository;
import com.erp.backend.repository.auth.RoleRepository;
import com.erp.backend.service.auth.MailService;
import com.erp.backend.exception.DuplicateRecordException;

@Service
public class EmployeeService {

    @Autowired
    private EmployeeRepository repository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private MailService mailService;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private jakarta.persistence.EntityManager entityManager;

    // CREATE
    @Transactional
    public Employee saveEmployee(Employee employee) {
        try {
            // 1. Validation Checks
            if (employee.getDepartment() == null || employee.getDepartment().trim().isEmpty()) {
                throw new IllegalArgumentException("Department is required.");
            }
            if (employee.getRole() == null || employee.getRole().trim().isEmpty()) {
                throw new IllegalArgumentException("Role is required.");
            }

            // Check if Employee Code is manually supplied and duplicate
            if (employee.getEmpCode() != null && !employee.getEmpCode().trim().isEmpty()) {
                String manualCode = employee.getEmpCode().trim().toUpperCase();
                if (repository.findByEmpCode(manualCode).isPresent()) {
                    throw new DuplicateRecordException("Employee Code already exists.");
                }
                employee.setEmpCode(manualCode);
            }

            // Check corporate email duplicates in employees and users table
            if (employee.getEmail() != null && !employee.getEmail().trim().isEmpty()) {
                String email = employee.getEmail().trim().toLowerCase();
                if (repository.findByEmail(email).isPresent()) {
                    throw new DuplicateRecordException("Email already exists.");
                }
                if (userRepository.findByEmail(email).isPresent()) {
                    throw new DuplicateRecordException("Email already exists.");
                }
            }

            // Check phone duplicate
            if (employee.getPhoneNumber() != null && !employee.getPhoneNumber().trim().isEmpty()) {
                String phone = employee.getPhoneNumber().trim();
                if (repository.findByPhoneNumber(phone).isPresent()) {
                    throw new DuplicateRecordException("Phone Number already exists.");
                }
            }

            // Auto-generate employee code if not set
            if (employee.getEmpCode() == null || employee.getEmpCode().trim().isEmpty()) {
                int suffix = 1000 + (int)(repository.count() + 1);
                String code = "EMP" + suffix;
                while (repository.findByEmpCode(code).isPresent()) {
                    suffix++;
                    code = "EMP" + suffix;
                }
                employee.setEmpCode(code);
            }

            // Check duplicate username in users table
            String username = employee.getEmpCode();
            if (userRepository.findByUsername(username).isPresent()) {
                throw new DuplicateRecordException("Username already exists.");
            }

            // 2. Set default leave balance if null
            if (employee.getLeaveBalance() == null) {
                employee.setLeaveBalance(15.0);
            }

            // 3. Save Employee first
            Employee saved = repository.save(employee);
            
            // Formulate username
            saved.setGeneratedUsername(username);
            
            // Generate secure temporary password
            String tempPassword = generateTempPassword();
            saved.setGeneratedPassword(tempPassword);
            
            // Encrypt password using BCrypt
            BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
            String hashedPassword = encoder.encode(tempPassword);
            
            // Map role
            String roleName = employee.getRole() != null ? employee.getRole().toUpperCase() : "EMPLOYEE";
            Role userRole = roleRepository.findByRoleName(roleName).orElse(null);
            if (userRole == null) {
                userRole = roleRepository.findByRoleName("EMPLOYEE").orElse(null);
            }
            
            // 3. Create User account and link it
            User user = new User();
            user.setUsername(username);
            user.setPassword(hashedPassword);
            user.setEmail(employee.getEmail());
            user.setRole(userRole);
            user.setFirstLogin(true);
            user.setEmployeeId(saved.getId());
            user.setStatus("ACTIVE");
            
            try {
                userRepository.save(user);
                auditLogService.saveLog("ADMIN", "User Created: " + username, "HR");
            } catch (org.springframework.dao.DataIntegrityViolationException dive) {
                System.err.println("User creation integrity violation error: ");
                dive.printStackTrace();
                throw new DuplicateRecordException("Username or Email already exists in User Account database.");
            }

            auditLogService.saveLog("HR_ADMIN", "Added Employee and Auto Created User: " + username, "HR");

            // Send Email notification asynchronously
            if (employee.getEmail() != null && !employee.getEmail().trim().isEmpty()) {
                CompletableFuture.runAsync(() -> {
                    try {
                        mailService.sendAlertMail(employee.getEmail(), "Welcome to NovaCore ERP",
                            "Welcome " + employee.getName() + ",\n\nYour ERP account has been created.\n\nUsername:\n" + username + "\n\nTemporary Password:\n" + tempPassword + "\n\nPlease log in and change your password immediately.\n\nThank you,\nNovaCore ERP");
                    } catch (Exception e) {
                        System.err.println("SMTP not configured, skipping welcome email: " + e.getMessage());
                    }
                });
            }

            return saved;
        } catch (Exception e) {
            System.err.println("Exception occurred in saveEmployee: ");
            e.printStackTrace();
            throw e;
        }
    }

    private String generateTempPassword() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
        StringBuilder sb = new StringBuilder();
        SecureRandom random = new SecureRandom();
        for (int i = 0; i < 10; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }

    // READ ALL
    public List<Employee> getAllEmployees() {

        return repository.findAll();
    }

    // READ BY ID
    public Employee getEmployeeById(Long id) {

        return repository.findById(id)
                .orElse(null);
    }

    // UPDATE
    public Employee updateEmployee(
            Long id,
            Employee employee) {

        Employee existing =
                repository.findById(id)
                        .orElse(null);

        if (existing != null) {
            // Validate duplicates for update
            if (employee.getEmail() != null && !employee.getEmail().trim().isEmpty()) {
                String email = employee.getEmail().trim().toLowerCase();
                java.util.Optional<Employee> dup = repository.findByEmail(email);
                if (dup.isPresent() && !dup.get().getId().equals(id)) {
                    throw new DuplicateRecordException("Email Address already exists.");
                }
            }
            if (employee.getPhoneNumber() != null && !employee.getPhoneNumber().trim().isEmpty()) {
                String phone = employee.getPhoneNumber().trim();
                java.util.Optional<Employee> dup = repository.findByPhoneNumber(phone);
                if (dup.isPresent() && !dup.get().getId().equals(id)) {
                    throw new DuplicateRecordException("Phone Number already exists.");
                }
            }

            existing.setName(employee.getName());
            existing.setDepartment(employee.getDepartment());
            existing.setSalary(employee.getSalary());
            existing.setEmail(employee.getEmail());
            existing.setPhoneNumber(employee.getPhoneNumber());
            existing.setDesignation(employee.getDesignation());
            existing.setRole(employee.getRole());
            existing.setJoiningDate(employee.getJoiningDate());
            existing.setStatus(employee.getStatus());

            // Synchronize User details
            try {
                userRepository.findByEmployeeId(id).ifPresent(user -> {
                    user.setEmail(employee.getEmail());
                    String roleName = employee.getRole() != null ? employee.getRole().toUpperCase() : "EMPLOYEE";
                    Role userRole = roleRepository.findByRoleName(roleName).orElse(null);
                    if (userRole != null) {
                        user.setRole(userRole);
                    }
                    userRepository.save(user);
                    System.out.println("[SYNC UPDATE] Synchronized user account details for employee ID: " + id);
                });
            } catch (Exception e) {
                System.err.println("Failed to sync user details: " + e.getMessage());
            }

            auditLogService.saveLog(
                    "ADMIN",
                    "Updated Employee : " + employee.getName(),
                    "HR");

            return repository.save(existing);
        }

        return null;
    }

    // DELETE
    @Transactional
    public void deleteEmployee(Long id) {
        deactivateEmployee(id);
    }

    @Transactional
    public void deactivateEmployee(Long id) {
        Employee employee = repository.findById(id)
                .orElseThrow(() -> new com.erp.backend.exception.DuplicateRecordException("Employee not found"));

        employee.setStatus("INACTIVE");
        repository.save(employee);

        auditLogService.saveLog("ADMIN", "Employee Deactivated: " + employee.getName() + " (" + employee.getEmpCode() + ")", "HR");

        // Lock / disable associated user if any
        try {
            userRepository.findByEmployeeId(id).ifPresent(user -> {
                user.setStatus("LOCKED");
                user.setLocked(true);
                userRepository.save(user);
                auditLogService.saveLog("ADMIN", "User Disabled: " + user.getUsername(), "HR");
                System.out.println("[SYNC DEACTIVATE] Disabled user account: " + user.getUsername());
            });
        } catch (Exception e) {
            System.err.println("Failed to lock associated user account: " + e.getMessage());
        }
    }

    @Transactional
    public void restoreEmployee(Long id) {
        Employee employee = repository.findById(id)
                .orElseThrow(() -> new com.erp.backend.exception.DuplicateRecordException("Employee not found"));

        employee.setStatus("ACTIVE");
        repository.save(employee);

        auditLogService.saveLog("ADMIN", "Employee Restored: " + employee.getName() + " (" + employee.getEmpCode() + ")", "HR");

        // Unlock / enable associated user if any
        try {
            userRepository.findByEmployeeId(id).ifPresent(user -> {
                user.setStatus("ACTIVE");
                user.setLocked(false);
                userRepository.save(user);
                auditLogService.saveLog("ADMIN", "User Enabled: " + user.getUsername(), "HR");
                System.out.println("[SYNC RESTORE] Enabled user account: " + user.getUsername());
            });
        } catch (Exception e) {
            System.err.println("Failed to unlock associated user account: " + e.getMessage());
        }
    }

    private boolean hasRelatedRecords(Long employeeId) {
        String[] tablesToCheck = {
            "attendance",
            "attendance_corrections",
            "employee_performance",
            "leave_requests",
            "notifications",
            "payroll",
            "payrolls",
            "sales_order",
            "sales_orders",
            "sales_target",
            "sales_targets",
            "task",
            "tasks"
        };
        
        for (String table : tablesToCheck) {
            try {
                Number count = (Number) entityManager.createNativeQuery(
                    "SELECT COUNT(*) FROM `" + table + "` WHERE `employee_id` = :empId"
                ).setParameter("empId", employeeId).getSingleResult();
                
                if (count != null && count.intValue() > 0) {
                    System.out.println("[DELETE EMPLOYEE CHECK] Found " + count + " related records in table: " + table);
                    return true;
                }
            } catch (Exception e) {
                // Ignore if table/column does not exist
            }
        }
        return false;
    }
}