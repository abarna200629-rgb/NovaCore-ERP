package com.erp.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.erp.backend.entity.Employee;

public interface EmployeeRepository
extends JpaRepository<Employee, Long> {
    java.util.Optional<Employee> findByEmpCode(String empCode);
    java.util.List<Employee> findByDepartment(String department);
    java.util.Optional<Employee> findByEmail(String email);
    java.util.Optional<Employee> findByPhoneNumber(String phoneNumber);
    java.util.List<Employee> findByStatusIgnoreCase(String status);
}