package com.erp.backend.repository.sales;

import org.springframework.data.jpa.repository.JpaRepository;
import com.erp.backend.entity.sales.Customer;

public interface CustomerRepository
        extends JpaRepository<Customer, Long> {
    java.util.Optional<Customer> findByEmail(String email);
    java.util.Optional<Customer> findByPhone(String phone);
}