package com.erp.backend.dto;

public class LoginResponse {

    private String token;
    private String role;
    private String username;
    private Boolean firstLogin = false;

    public LoginResponse() {
    }

    public LoginResponse(String token, String role) {
        this.token = token;
        this.role = role;
    }

    public LoginResponse(String token, String role, String username) {
        this.token = token;
        this.role = role;
        this.username = username;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public Boolean getFirstLogin() {
        return firstLogin;
    }

    public void setFirstLogin(Boolean firstLogin) {
        this.firstLogin = firstLogin;
    }
}