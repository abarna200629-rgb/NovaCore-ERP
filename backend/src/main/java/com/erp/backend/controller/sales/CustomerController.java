package com.erp.backend.controller.sales;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.erp.backend.entity.sales.Customer;
import com.erp.backend.service.sales.CustomerService;

@RestController
@RequestMapping("/api/customers")
@CrossOrigin("*")
public class CustomerController {

    @Autowired
    private CustomerService customerService;

    // CREATE CUSTOMER

    @PostMapping
    public Customer save(
            @RequestBody Customer customer) {

        return customerService.save(customer);
    }

    // GET ALL CUSTOMERS

    @GetMapping
    public List<Customer> getAll() {

        return customerService.getAll();
    }

    // GET CUSTOMER BY ID

    @GetMapping("/{id}")
    public Customer getById(
            @PathVariable Long id) {

        return customerService.getById(id);
    }

    // UPDATE CUSTOMER

    @PutMapping("/{id}")
    public Customer update(
            @PathVariable Long id,
            @RequestBody Customer customer) {

        Customer existing =
                customerService.getById(id);

        if (existing == null) {

            throw new RuntimeException(
                    "Customer Not Found");
        }

        existing.setCustomerName(
                customer.getCustomerName());

        existing.setEmail(
                customer.getEmail());

        existing.setPhone(
                customer.getPhone());

        existing.setAddress(
                customer.getAddress());

        return customerService.save(
                existing);
    }

    // DELETE CUSTOMER

    @DeleteMapping("/{id}")
    public String delete(
            @PathVariable Long id) {

        customerService.delete(id);

        return "Customer Deleted Successfully";
    }
}