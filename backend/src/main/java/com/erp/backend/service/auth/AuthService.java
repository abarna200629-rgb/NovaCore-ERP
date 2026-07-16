package com.erp.backend.service.auth;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import com.erp.backend.entity.auth.User;
import com.erp.backend.entity.Employee;
import com.erp.backend.repository.auth.RoleRepository;
import com.erp.backend.repository.auth.UserRepository;
import com.erp.backend.repository.EmployeeRepository;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private MailService mailService;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private com.erp.backend.repository.auth.PasswordHistoryRepository passwordHistoryRepository;

    // STEP 1 - SEND OTP

    public boolean sendLoginOtp(
            String username,
            String password) {

        User user =
                userRepository
                        .findByUsername(username)
                        .orElse(null);

        if (user != null && (Boolean.TRUE.equals(user.getLocked()) || "LOCKED".equalsIgnoreCase(user.getStatus()))) {
            throw new com.erp.backend.exception.ConflictException("Your account has been deactivated. Please contact the HR Department or Administrator.");
        }

        if (user == null) {
            return false;
        }

        String storedPassword = user.getPassword();
        boolean passwordMatches = false;
        if (storedPassword != null) {
            if (storedPassword.startsWith("$2a$") || storedPassword.startsWith("$2b$") || storedPassword.startsWith("$2y$")) {
                BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
                passwordMatches = encoder.matches(password, storedPassword);
            } else {
                passwordMatches = storedPassword.equals(password);
            }
        }

        if (!passwordMatches) {
            return false;
        }

        String otp =
                String.valueOf(
                        ThreadLocalRandom
                                .current()
                                .nextInt(
                                        100000,
                                        999999));

        user.setOtp(otp);

        user.setOtpExpiry(
                LocalDateTime.now()
                        .plusMinutes(10));

        userRepository.save(user);

        mailService.sendOtpMail(
                user.getEmail(),
                otp);

        return true;
    }

    // STEP 2 - VERIFY OTP

    public User verifyLoginOtp(
            String username,
            String otp) {

        User user =
                userRepository
                        .findByUsername(username)
                        .orElse(null);

        if (user == null) {
            return null;
        }

        if (user.getOtp() == null) {
            return null;
        }

        if (!user.getOtp().equals(otp)) {
            return null;
        }

        if (user.getOtpExpiry() == null ||
                user.getOtpExpiry()
                        .isBefore(
                                LocalDateTime.now())) {

            return null;
        }

        if (Boolean.TRUE.equals(user.getLocked())) {
            return null;
        }

        user.setOtp(null);

        user.setOtpExpiry(null);

        user.setLastLogin(LocalDateTime.now());

        userRepository.save(user);

        return user;
    }

    // CREATE USER

    public User createUser(
            String username,
            String password,
            String email,
            Long roleId) {

        User user = new User();

        user.setUsername(username);

        user.setPassword(password);

        user.setEmail(email);

        user.setRole(
                roleRepository
                        .findById(roleId)
                        .orElse(null));

        return userRepository.save(user);
    }

    public List<User> getAllUsers() {
        List<User> users = userRepository.findAll();
        List<Employee> employees = employeeRepository.findAll();
        
        for (User user : users) {
            Employee matched = null;
            if (user.getEmployeeId() != null) {
                matched = employees.stream()
                    .filter(e -> user.getEmployeeId().equals(e.getId()))
                    .findFirst().orElse(null);
            }
            if (matched == null && user.getUsername() != null) {
                matched = employees.stream()
                    .filter(e -> user.getUsername().equalsIgnoreCase(e.getEmpCode()))
                    .findFirst().orElse(null);
            }
            if (matched != null) {
                user.setEmployeeId(matched.getId());
                user.setEmployeeName(matched.getName());
                user.setDepartment(matched.getDepartment());
                user.setEmpCode(matched.getEmpCode());
                user.setEmployeeStatus(matched.getStatus());
            }
        }
        return users;
    }

    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    public String changePassword(String username, String oldPassword, String newPassword) {
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            return "User Not Found";
        }
        
        String storedPassword = user.getPassword();
        boolean passwordMatches = false;
        if (storedPassword != null) {
            if (storedPassword.startsWith("$2a$") || storedPassword.startsWith("$2b$") || storedPassword.startsWith("$2y$")) {
                BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
                passwordMatches = encoder.matches(oldPassword, storedPassword);
            } else {
                passwordMatches = storedPassword.equals(oldPassword);
            }
        }
        
        if (!passwordMatches) {
            return "Invalid Current Password";
        }
        
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        user.setPassword(encoder.encode(newPassword));
        user.setFirstLogin(false);
        userRepository.save(user);
        return "SUCCESS";
    }

    public boolean forgotPassword(String email) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return false;
        }

        String otp = String.valueOf(ThreadLocalRandom.current().nextInt(100000, 999999));
        user.setOtp(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(10));
        userRepository.save(user);

        mailService.sendAlertMail(
                user.getEmail(),
                "NovaCore ERP Password Reset Verification",
                "You requested a password reset for your NovaCore ERP account.\n\n" +
                "Your verification OTP is: " + otp + "\n\n" +
                "Valid for 10 minutes. If you did not make this request, please secure your account immediately.");
        return true;
    }

    public void savePasswordHistory(Long userId, String passwordHash) {
        com.erp.backend.entity.auth.PasswordHistory history = new com.erp.backend.entity.auth.PasswordHistory();
        history.setUserId(userId);
        history.setPasswordHash(passwordHash);
        history.setCreatedAt(LocalDateTime.now());
        passwordHistoryRepository.save(history);
    }

    public boolean isPasswordPreviouslyUsed(Long userId, String newPassword) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        
        User user = userRepository.findById(userId).orElse(null);
        if (user != null && user.getPassword() != null) {
            String currentHash = user.getPassword();
            if (currentHash.startsWith("$2a$") || currentHash.startsWith("$2b$") || currentHash.startsWith("$2y$")) {
                if (encoder.matches(newPassword, currentHash)) {
                    return true;
                }
            } else {
                if (currentHash.equals(newPassword)) {
                    return true;
                }
            }
        }

        List<com.erp.backend.entity.auth.PasswordHistory> historyList =
                passwordHistoryRepository.findByUserIdOrderByCreatedAtDesc(userId);

        int checkLimit = Math.min(historyList.size(), 3);
        for (int i = 0; i < checkLimit; i++) {
            String hash = historyList.get(i).getPasswordHash();
            if (hash.startsWith("$2a$") || hash.startsWith("$2b$") || hash.startsWith("$2y$")) {
                if (encoder.matches(newPassword, hash)) {
                    return true;
                }
            } else {
                if (hash.equals(newPassword)) {
                    return true;
                }
            }
        }
        return false;
    }

    public void deleteOldPasswords(Long userId) {
        List<com.erp.backend.entity.auth.PasswordHistory> historyList =
                passwordHistoryRepository.findByUserIdOrderByCreatedAtAsc(userId);
        if (historyList.size() > 3) {
            int toDelete = historyList.size() - 3;
            for (int i = 0; i < toDelete; i++) {
                passwordHistoryRepository.delete(historyList.get(i));
            }
        }
    }

    public String resetPassword(String email, String otp, String newPassword) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return "User Not Found";
        }

        if (user.getOtp() == null || !user.getOtp().equals(otp)) {
            return "Invalid OTP Code";
        }

        if (user.getOtpExpiry() == null || user.getOtpExpiry().isBefore(LocalDateTime.now())) {
            return "OTP Code Expired";
        }

        if (isPasswordPreviouslyUsed(user.getId(), newPassword)) {
            return "You cannot reuse your last 3 passwords.";
        }

        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

        // Save current password hash to history if it's not already the latest entry
        String currentHash = user.getPassword();
        if (currentHash != null) {
            List<com.erp.backend.entity.auth.PasswordHistory> historyList =
                passwordHistoryRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
            boolean currentAlreadyInHistory = false;
            if (!historyList.isEmpty()) {
                currentAlreadyInHistory = historyList.get(0).getPasswordHash().equals(currentHash);
            }
            if (!currentAlreadyInHistory) {
                savePasswordHistory(user.getId(), currentHash);
            }
        }

        String encodedNewPassword = encoder.encode(newPassword);
        user.setPassword(encodedNewPassword);
        user.setOtp(null);
        user.setOtpExpiry(null);
        user.setFirstLogin(false);
        userRepository.save(user);

        // Save new password to history and prune old ones
        savePasswordHistory(user.getId(), encodedNewPassword);
        deleteOldPasswords(user.getId());

        return "SUCCESS";
    }

    public User updateUser(Long id, String username, String email, Long roleId, String status) {
        return updateUser(id, username, email, roleId, status, null);
    }

    public User updateUser(Long id, String username, String email, Long roleId, String status, Long employeeId) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) return null;

        // Check duplicate username for another user
        if (username != null && !username.trim().isEmpty()) {
            java.util.Optional<User> existingUser = userRepository.findByUsername(username.trim());
            if (existingUser.isPresent() && !existingUser.get().getId().equals(id)) {
                System.out.println("Duplicate Username: " + username.trim());
                throw new com.erp.backend.exception.DuplicateRecordException("Username already exists.");
            }
            user.setUsername(username.trim());
        }

        // Check duplicate email for another user
        if (email != null && !email.trim().isEmpty()) {
            String cleanEmail = email.trim().toLowerCase();
            java.util.Optional<User> existingEmail = userRepository.findByEmail(cleanEmail);
            if (existingEmail.isPresent() && !existingEmail.get().getId().equals(id)) {
                System.out.println("Duplicate Email: " + cleanEmail);
                throw new com.erp.backend.exception.DuplicateRecordException("Email already exists.");
            }
            user.setEmail(cleanEmail);
        }

        // Check duplicate employee mapping
        if (employeeId != null) {
            java.util.Optional<User> existingEmployeeUser = userRepository.findByEmployeeId(employeeId);
            if (existingEmployeeUser.isPresent() && !existingEmployeeUser.get().getId().equals(id)) {
                System.out.println("Duplicate Employee: employeeId=" + employeeId);
                throw new com.erp.backend.exception.DuplicateRecordException("Employee is already linked to another account.");
            }
            user.setEmployeeId(employeeId);
        }

        user.setStatus(status);
        if (roleId != null) {
            user.setRole(roleRepository.findById(roleId).orElse(null));
        } else {
            user.setRole(null);
        }

        try {
            return userRepository.save(user);
        } catch (org.springframework.dao.DataIntegrityViolationException dive) {
            System.out.println("DataIntegrityViolationException on user update: " + dive.getMessage());
            throw new com.erp.backend.exception.DuplicateRecordException("Username or Email is already in use by another account.");
        }
    }

    public User lockUnlockUser(Long id, boolean lock) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) return null;
        user.setLocked(lock);
        return userRepository.save(user);
    }

    public boolean resetUserPasswordAdmin(Long id, String newPassword) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) return false;
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        user.setPassword(encoder.encode(newPassword));
        user.setFirstLogin(true); // force change on next login
        userRepository.save(user);
        return true;
    }
}