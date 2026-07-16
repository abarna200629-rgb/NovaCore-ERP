package com.erp.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.erp.backend.dto.LoginOtpRequest;
import com.erp.backend.dto.LoginResponse;
import com.erp.backend.dto.VerifyOtpRequest;
import com.erp.backend.dto.ChangePasswordRequest;
import com.erp.backend.entity.auth.User;
import com.erp.backend.jwt.JwtUtil;
import com.erp.backend.service.auth.AuthService;
import com.erp.backend.repository.EmployeeRepository;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin("*")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private EmployeeRepository employeeRepository;

    // STEP 1 - Username + Password
    @PostMapping("/login")
    public String login(
            @RequestBody LoginOtpRequest request) {

        boolean otpSent =
                authService.sendLoginOtp(
                        request.getUsername(),
                        request.getPassword());

        if (otpSent) {
            return "OTP Sent Successfully";
        }

        return "Invalid Username or Password";
    }

    // STEP 2 - Verify OTP
    @PostMapping("/verify-otp")
    public LoginResponse verifyOtp(
            @RequestBody VerifyOtpRequest request) {

        User user =
                authService.verifyLoginOtp(
                        request.getUsername(),
                        request.getOtp());

        if (user == null) {
            return null;
        }

        String roleName = null;
        if (user.getRole() != null) {
            roleName = user.getRole().getRoleName();
        } else if (user.getRoleString() != null) {
            roleName = user.getRoleString();
        }
        if (roleName == null) {
            roleName = "EMPLOYEE";
        }

        String department = "N/A";
        if (user.getEmployeeId() != null) {
            com.erp.backend.entity.Employee emp = employeeRepository.findById(user.getEmployeeId()).orElse(null);
            if (emp != null && emp.getDepartment() != null) {
                department = emp.getDepartment();
            }
        }

        LoginResponse response = new LoginResponse();

        response.setToken(
                JwtUtil.generateToken(
                        user.getId(),
                        user.getEmployeeId(),
                        user.getUsername(),
                        roleName,
                        department,
                        user.getStatus()
                ));

        response.setRole(roleName);
        response.setUsername(user.getUsername());
        response.setFirstLogin(user.getFirstLogin() != null && user.getFirstLogin());

        return response;
    }

    @PostMapping("/change-password")
    public String changePassword(@RequestBody ChangePasswordRequest request) {
        return authService.changePassword(request.getUsername(), request.getOldPassword(), request.getNewPassword());
    }

    @PostMapping("/forgot-password")
    public String forgotPassword(@RequestBody java.util.Map<String, String> body) {
        boolean success = authService.forgotPassword(body.get("email"));
        return success ? "OTP Sent Successfully" : "Email Not Found";
    }

    @PostMapping("/reset-password")
    public org.springframework.http.ResponseEntity<?> resetPassword(@RequestBody java.util.Map<String, String> body) {
        String result = authService.resetPassword(body.get("email"), body.get("otp"), body.get("newPassword"));
        if ("SUCCESS".equals(result)) {
            return org.springframework.http.ResponseEntity.ok("SUCCESS");
        } else if ("You cannot reuse your last 3 passwords.".equals(result)) {
            java.util.Map<String, Object> errorResponse = new java.util.HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "You cannot reuse your last 3 passwords.");
            return org.springframework.http.ResponseEntity.status(org.springframework.http.HttpStatus.BAD_REQUEST).body(errorResponse);
        } else {
            java.util.Map<String, Object> errorResponse = new java.util.HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", result);
            return org.springframework.http.ResponseEntity.status(org.springframework.http.HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }
}