package com.erp.backend.service.sales;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.erp.backend.entity.sales.Customer;
import com.erp.backend.repository.sales.CustomerRepository;
import com.erp.backend.exception.DuplicateRecordException;

@Service
public class CustomerService {

    @Autowired
    private CustomerRepository customerRepository;

    public Customer save(Customer customer) {
        if (customer.getEmail() != null && !customer.getEmail().trim().isEmpty()) {
            String email = customer.getEmail().trim().toLowerCase();
            java.util.Optional<Customer> dup = customerRepository.findByEmail(email);
            if (dup.isPresent() && (customer.getId() == null || !dup.get().getId().equals(customer.getId()))) {
                throw new DuplicateRecordException("Email Address already exists.");
            }
        }
        if (customer.getPhone() != null && !customer.getPhone().trim().isEmpty()) {
            String phone = customer.getPhone().trim();
            java.util.Optional<Customer> dup = customerRepository.findByPhone(phone);
            if (dup.isPresent() && (customer.getId() == null || !dup.get().getId().equals(customer.getId()))) {
                throw new DuplicateRecordException("Phone Number already exists.");
            }
        }
        return customerRepository.save(customer);
    }

    public List<Customer> getAll() {
        return customerRepository.findAll();
    }

    public Customer getById(Long id) {
        return customerRepository.findById(id).orElse(null);
    }

    public void delete(Long id) {
        customerRepository.deleteById(id);
    }
}