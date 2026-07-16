package com.erp.backend.controller.sales;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.erp.backend.entity.sales.SalesOrder;
import com.erp.backend.service.sales.SalesOrderService;
import com.erp.backend.entity.inventory.Product;
import com.erp.backend.repository.inventory.ProductRepository;
import com.erp.backend.dto.SalesAnalyticsDTO;
import com.erp.backend.entity.sales.Customer;
import com.erp.backend.service.sales.CustomerService;

@RestController
@RequestMapping("/api/sales")
@CrossOrigin("*")
public class SalesController {

    @Autowired
    private SalesOrderService service;
    @Autowired
    private ProductRepository productRepository;
    @Autowired
    private CustomerService customerService;

    @GetMapping("/customers")
    public List<Customer> getSalesCustomers() {
        return customerService.getAll();
    }

    @PostMapping("/customers")
    public Customer createSalesCustomer(@RequestBody Customer customer) {
        return customerService.save(customer);
    }

    @GetMapping("/products")
    public List<Product> getProducts() {

        return productRepository.findAll();
    }
    @PostMapping({"", "/orders"})
    public SalesOrder createSales(
            @RequestBody SalesOrder sales) {

        return service.save(sales);
    }

    @GetMapping({"", "/orders"})
    public List<SalesOrder> getAllSales() {

        return service.getAll();
    }
    
    @PutMapping("/{id}")
    public SalesOrder updateSales(
            @PathVariable Long id,
            @RequestBody SalesOrder sales) {

        return service.update(id, sales);
    }
    @DeleteMapping("/{id}")
    public String deleteSales(
            @PathVariable Long id) {

        service.delete(id);

        return "Deleted";
    }
    @GetMapping("/analytics")
    public List<SalesAnalyticsDTO>
    analytics() {

        return service.getTopProducts();
    }
}