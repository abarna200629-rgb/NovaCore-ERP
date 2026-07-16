package com.erp.backend.jwt;

import java.security.Key;
import java.util.Date;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

@org.springframework.stereotype.Component
public class JwtUtil {

    private static String secretKey = "mysecretkeymysecretkeymysecretkey123456";
    private static Key KEY = Keys.hmacShaKeyFor(secretKey.getBytes());

    @org.springframework.beans.factory.annotation.Value("${jwt.secret:mysecretkeymysecretkeymysecretkey123456}")
    public void setSecretKey(String secret) {
        JwtUtil.secretKey = secret;
        JwtUtil.KEY = Keys.hmacShaKeyFor(secret.getBytes());
    }

    // GENERATE TOKEN WITH FULL CLAIMS
    public static String generateToken(Long userId, Long employeeId, String username, String role, String department, String status) {
        return Jwts.builder()
                .setSubject(username)
                .claim("userId", userId)
                .claim("employeeId", employeeId)
                .claim("username", username)
                .claim("role", role)
                .claim("department", department != null ? department : "N/A")
                .claim("status", status != null ? status : "ACTIVE")
                .setIssuedAt(new Date())
                .setExpiration(
                        new Date(System.currentTimeMillis() + 1000 * 60 * 60)) // 1 hour
                .signWith(KEY, SignatureAlgorithm.HS256)
                .compact();
    }

    public static String generateToken(String username, String role) {
        return generateToken(null, null, username, role, "N/A", "ACTIVE");
    }

    // EXTRACT ALL CLAIMS
    public static Claims extractClaims(String token) {

        return Jwts.parserBuilder()
                .setSigningKey(KEY)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    // USERNAME
    public static String extractUsername(String token) {
        return extractClaims(token).getSubject();
    }

    // ROLE
    public static String extractRole(String token) {
        return extractClaims(token).get("role", String.class);
    }

    // VALIDATION
    public static boolean validateToken(String token) {
        try {
            extractClaims(token);
            return true;
        } catch (Exception e) {
            System.out.println("JWT ERROR: " + e.getMessage());
            return false;
        }
    }
}