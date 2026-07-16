package com.erp.backend.config;

import com.erp.backend.jwt.JwtFilter;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;

import org.springframework.security.config.annotation.web.builders.HttpSecurity;

import org.springframework.security.config.http.SessionCreationPolicy;

import org.springframework.security.web.SecurityFilterChain;

import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;


import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.List;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {


    @Autowired
    private JwtFilter jwtFilter;

    @Autowired
    private CorsConfigurationSource corsConfigurationSource;


    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http) throws Exception {


        http

        .cors(cors -> cors.configurationSource(corsConfigurationSource))

        .csrf(csrf -> csrf.disable())


        .sessionManagement(session ->
            session.sessionCreationPolicy(
                    SessionCreationPolicy.STATELESS
            )
        )


        .authorizeHttpRequests(auth -> auth


            // LOGIN
            .requestMatchers(
                    "/api/auth/**",
                    "/api/health"
            )
            .permitAll()



            // DASHBOARD & NOTIFICATIONS
            .requestMatchers(
                    "/api/dashboard",
                    "/api/notifications/**"
            )
            .authenticated()



            // AI COPILOT
            .requestMatchers(
                    "/api/ai/**"
            )
            .hasAnyAuthority("ADMIN", "ROLE_ADMIN", "HR", "ROLE_HR", "FINANCE", "ROLE_FINANCE", "INVENTORY", "ROLE_INVENTORY", "SALES", "ROLE_SALES", "PRODUCTION", "ROLE_PRODUCTION", "EMPLOYEE", "ROLE_EMPLOYEE")



            // ADMIN MODULE
            .requestMatchers(
                    "/api/admin/**"
            )
            .hasAnyAuthority("ADMIN", "ROLE_ADMIN")



            // SHARED MODULES FOR TAX REPORTS (FINANCE ACCESS)
            .requestMatchers(
                    "/api/sales/orders",
                    "/api/inventory/purchases"
            )
            .hasAnyAuthority("ADMIN", "ROLE_ADMIN", "FINANCE", "ROLE_FINANCE", "SALES", "ROLE_SALES", "INVENTORY", "ROLE_INVENTORY")

            // SHARED MODULES FOR SALES ORDER CREATION (SALES ACCESS TO PRODUCTS & EMPLOYEES)
            .requestMatchers(
                    "/api/inventory/products",
                    "/api/employees",
                    "/api/employees/**"
            )
            .hasAnyAuthority("ADMIN", "ROLE_ADMIN", "SALES", "ROLE_SALES", "INVENTORY", "ROLE_INVENTORY", "HR", "ROLE_HR", "FINANCE", "ROLE_FINANCE", "PRODUCTION", "ROLE_PRODUCTION", "EMPLOYEE", "ROLE_EMPLOYEE")



            // INVENTORY MODULE
            .requestMatchers(
                    "/api/inventory/**"
            )
            .hasAnyAuthority("ADMIN", "ROLE_ADMIN", "INVENTORY", "ROLE_INVENTORY")



            // PRODUCTION MODULE
            .requestMatchers(
                    "/api/production/**"
            )
            .hasAnyAuthority("ADMIN", "ROLE_ADMIN", "INVENTORY", "ROLE_INVENTORY", "PRODUCTION", "ROLE_PRODUCTION")



            // SALES & CUSTOMERS MODULE
            .requestMatchers(
                    "/api/sales/**",
                    "/api/sales-target/**",
                    "/api/customers/**"
            )
            .hasAnyAuthority("ADMIN", "ROLE_ADMIN", "SALES", "ROLE_SALES")



            // CREDIT RISK CHECK FOR SALES
            .requestMatchers(
                    "/api/finance/credit-risk/**"
            )
            .hasAnyAuthority("ADMIN", "ROLE_ADMIN", "FINANCE", "ROLE_FINANCE", "SALES", "ROLE_SALES")



            // FINANCE MODULE
            .requestMatchers(
                    "/api/finance/**"
            )
            .hasAnyAuthority("ADMIN", "ROLE_ADMIN", "FINANCE", "ROLE_FINANCE")



            // HR & PERFORMANCE MODULES
            .requestMatchers(
                    "/api/hr/**",
                    "/api/performance/**"
            )
            .hasAnyAuthority("ADMIN", "ROLE_ADMIN", "HR", "ROLE_HR", "FINANCE", "ROLE_FINANCE", "INVENTORY", "ROLE_INVENTORY", "SALES", "ROLE_SALES", "PRODUCTION", "ROLE_PRODUCTION", "EMPLOYEE", "ROLE_EMPLOYEE")



            // TASKS MODULE
            .requestMatchers(
                    "/api/tasks/**"
            )
            .hasAnyAuthority("ADMIN", "ROLE_ADMIN", "HR", "ROLE_HR", "SALES", "ROLE_SALES", "INVENTORY", "ROLE_INVENTORY", "FINANCE", "ROLE_FINANCE", "PRODUCTION", "ROLE_PRODUCTION", "EMPLOYEE", "ROLE_EMPLOYEE")



            .anyRequest()
            .authenticated()

        )



        .addFilterBefore(
                jwtFilter,
                UsernamePasswordAuthenticationFilter.class
        );


        return http.build();

    }

}