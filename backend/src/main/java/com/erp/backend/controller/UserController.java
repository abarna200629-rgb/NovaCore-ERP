package com.erp.backend.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.erp.backend.dto.CreateUserRequest;
import com.erp.backend.entity.auth.User;
import com.erp.backend.service.auth.AuthService;

import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/users")
@CrossOrigin("*")
@PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN', 'HR', 'ROLE_HR')")
public class UserController {

    @Autowired
    private AuthService authService;

    @Autowired
    private com.erp.backend.repository.auth.RoleRepository roleRepository;

    @GetMapping("/roles")
    public List<com.erp.backend.entity.auth.Role> getRoles() {
        return roleRepository.findAll();
    }

    @GetMapping
    public List<User> getUsers() {
        return authService.getAllUsers();
    }

    @PostMapping
    public User createUser(
            @RequestBody CreateUserRequest request) {

        return authService.createUser(
                request.getUsername(),
                request.getPassword(),
                request.getEmail(),
                request.getRoleId());
    }

    @DeleteMapping("/{id}")
    public String deleteUser(
            @PathVariable Long id) {

        authService.deleteUser(id);

        return "User Deleted";
    }

    @PutMapping("/{id}")
    public User updateUser(@PathVariable Long id, @RequestBody java.util.Map<String, Object> body) {
        String username = (String) body.get("username");
        String email = (String) body.get("email");
        String status = (String) body.get("status");
        Number roleIdNum = (Number) body.get("roleId");
        Long roleId = roleIdNum != null ? roleIdNum.longValue() : null;
        
        Number employeeIdNum = (Number) body.get("employeeId");
        Long employeeId = employeeIdNum != null ? employeeIdNum.longValue() : null;
        
        return authService.updateUser(id, username, email, roleId, status, employeeId);
    }

    @PostMapping("/{id}/lock")
    public User lockUser(@PathVariable Long id) {
        return authService.lockUnlockUser(id, true);
    }

    @PostMapping("/{id}/unlock")
    public User unlockUser(@PathVariable Long id) {
        return authService.lockUnlockUser(id, false);
    }

    @PostMapping("/{id}/reset-password")
    public java.util.Map<String, Object> resetPassword(@PathVariable Long id, @RequestBody java.util.Map<String, String> body) {
        String newPassword = body.get("password");
        boolean success = authService.resetUserPasswordAdmin(id, newPassword);
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("success", success);
        response.put("message", success ? "User password reset successfully." : "Failed to reset user password.");
        return response;
    }
}