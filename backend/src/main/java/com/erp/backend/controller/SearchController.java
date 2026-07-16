package com.erp.backend.controller;

import java.util.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.erp.backend.repository.EmployeeRepository;
import com.erp.backend.repository.inventory.ProductRepository;
import com.erp.backend.repository.sales.CustomerRepository;
import com.erp.backend.repository.sales.SalesOrderRepository;
import com.erp.backend.repository.hr.LeaveRepository;
import com.erp.backend.repository.hr.AttendanceRepository;
import com.erp.backend.repository.inventory.SupplierRepository;
import com.erp.backend.repository.inventory.PurchaseRequestRepository;
import com.erp.backend.entity.Employee;
import com.erp.backend.entity.inventory.Product;
import com.erp.backend.entity.sales.Customer;
import com.erp.backend.entity.sales.SalesOrder;
import com.erp.backend.entity.inventory.Supplier;
import com.erp.backend.entity.inventory.PurchaseRequest;
import com.erp.backend.entity.hr.LeaveRequest;
import com.erp.backend.entity.hr.Attendance;

@RestController
@RequestMapping("/api/search")
@CrossOrigin("*")
public class SearchController {

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private SalesOrderRepository salesOrderRepository;

    @Autowired
    private LeaveRepository leaveRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private PurchaseRequestRepository purchaseRequestRepository;

    public static class SearchResult {
        private String title;
        private String type;
        private String route;
        private String details;

        public SearchResult() {}
        public SearchResult(String title, String type, String route, String details) {
            this.title = title;
            this.type = type;
            this.route = route;
            this.details = details;
        }

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public String getRoute() { return route; }
        public void setRoute(String route) { this.route = route; }
        public String getDetails() { return details; }
        public void setDetails(String details) { this.details = details; }
    }

    @GetMapping
    public List<SearchResult> search(@RequestParam("q") String query, org.springframework.security.core.Authentication auth) {
        List<SearchResult> results = new ArrayList<>();
        if (query == null || query.trim().length() < 2) {
            return results;
        }
        String q = query.toLowerCase().trim();
        String role = auth.getAuthorities().iterator().next().getAuthority().toUpperCase().replace("ROLE_", "");
        String username = auth.getName();

        // 1. EMPLOYEE SEARCH
        if ("EMPLOYEE".equals(role)) {
            Optional<Employee> currentEmpOpt = employeeRepository.findAll().stream()
                .filter(e -> username.equalsIgnoreCase(e.getEmail()) || username.equalsIgnoreCase(e.getEmpCode()))
                .findFirst();
            if (currentEmpOpt.isPresent()) {
                Employee emp = currentEmpOpt.get();
                if (emp.getName().toLowerCase().contains(q) || (emp.getDepartment() != null && emp.getDepartment().toLowerCase().contains(q))) {
                    results.add(new SearchResult("My Profile: " + emp.getName(), "HR", "/home", emp.getDesignation() + " - " + emp.getDepartment()));
                }
                
                leaveRepository.findAll().stream()
                    .filter(l -> emp.getId().equals(l.getEmployeeId()))
                    .filter(l -> l.getLeaveType().toLowerCase().contains(q) || (l.getStatus() != null && l.getStatus().toLowerCase().contains(q)))
                    .forEach(l -> results.add(new SearchResult("My Leave Request: #" + l.getId() + " (" + l.getLeaveType() + ")", "HR", "/leave", "Status: " + l.getStatus() + " | " + l.getFromDate() + " to " + l.getToDate())));
                
                attendanceRepository.findAll().stream()
                    .filter(a -> emp.getId().equals(a.getEmployeeId()))
                    .filter(a -> a.getDate().contains(q) || (a.getStatus() != null && a.getStatus().toLowerCase().contains(q)))
                    .forEach(a -> results.add(new SearchResult("My Attendance: " + a.getDate() + " (" + a.getStatus() + ")", "HR", "/attendance", "In: " + a.getCheckInTime() + " | Out: " + a.getCheckOutTime())));
            }
            return results;
        }

        // 2. INVENTORY SEARCH
        if ("INVENTORY".equals(role)) {
            productRepository.findAll().stream()
                .filter(p -> p.getProductName().toLowerCase().contains(q) || (p.getCategory() != null && p.getCategory().toLowerCase().contains(q)))
                .forEach(p -> results.add(new SearchResult("Product: " + p.getProductName(), "INVENTORY", "/products", "Stock: " + p.getQuantity() + " | Price: ₹" + p.getPrice())));
            
            supplierRepository.findAll().stream()
                .filter(s -> s.getName().toLowerCase().contains(q) || (s.getCity() != null && s.getCity().toLowerCase().contains(q)))
                .forEach(s -> results.add(new SearchResult("Supplier: " + s.getName(), "INVENTORY", "/suppliers", "Phone: " + s.getPhone() + " | City: " + s.getCity())));
            
            productRepository.findAll().stream()
                .filter(p -> p.getWarehouse() != null && p.getWarehouse().toLowerCase().contains(q))
                .forEach(p -> results.add(new SearchResult("Warehouse Stock: " + p.getProductName(), "INVENTORY", "/products", "Location: " + p.getWarehouse() + " | Qty: " + p.getQuantity())));
            
            purchaseRequestRepository.findAll().stream()
                .filter(po -> po.getProductName().toLowerCase().contains(q) || (po.getStatus() != null && po.getStatus().toLowerCase().contains(q)))
                .forEach(po -> results.add(new SearchResult("Purchase Order #" + po.getId() + ": " + po.getProductName(), "INVENTORY", "/purchase-orders", "Qty: " + po.getQuantity() + " | Status: " + po.getStatus())));
            
            return results;
        }

        // 3. SALES SEARCH
        if ("SALES".equals(role)) {
            customerRepository.findAll().stream()
                .filter(c -> c.getCustomerName().toLowerCase().contains(q) || (c.getEmail() != null && c.getEmail().toLowerCase().contains(q)))
                .forEach(c -> results.add(new SearchResult("Customer: " + c.getCustomerName(), "SALES", "/customers", "Email: " + c.getEmail() + " | Phone: " + c.getPhone())));
            
            salesOrderRepository.findAll().stream()
                .filter(o -> o.getCustomerName().toLowerCase().contains(q) || o.getProductName().toLowerCase().contains(q))
                .forEach(o -> results.add(new SearchResult("Sales Order: #" + o.getId() + " (" + o.getProductName() + ")", "SALES", "/sales", "Client: " + o.getCustomerName() + " | Total: ₹" + o.getTotalAmount())));
            
            return results;
        }

        // 4. HR SEARCH
        if ("HR".equals(role)) {
            employeeRepository.findAll().stream()
                .filter(emp -> emp.getName().toLowerCase().contains(q) || (emp.getDepartment() != null && emp.getDepartment().toLowerCase().contains(q)))
                .forEach(emp -> results.add(new SearchResult("Employee: " + emp.getName(), "HR", "/employees", emp.getDesignation() + " - " + emp.getDepartment())));
            
            attendanceRepository.findAll().stream()
                .filter(a -> a.getDate().contains(q) || (a.getStatus() != null && a.getStatus().toLowerCase().contains(q)))
                .forEach(a -> results.add(new SearchResult("Attendance Record: " + a.getDate() + " (" + a.getStatus() + ")", "HR", "/attendance", "Employee ID: " + a.getEmployeeId())));
            
            leaveRepository.findAll().stream()
                .filter(l -> l.getLeaveType().toLowerCase().contains(q) || (l.getStatus() != null && l.getStatus().toLowerCase().contains(q)))
                .forEach(l -> results.add(new SearchResult("Leave Request #" + l.getId() + " (" + l.getLeaveType() + ")", "HR", "/leave", "Status: " + l.getStatus() + " | Employee ID: " + l.getEmployeeId())));
            
            return results;
        }

        // 5. ADMIN / FINANCE / MANAGER SEARCH (ALL MODULES)
        employeeRepository.findAll().stream()
            .filter(emp -> emp.getName().toLowerCase().contains(q) || (emp.getDepartment() != null && emp.getDepartment().toLowerCase().contains(q)))
            .forEach(emp -> results.add(new SearchResult("Employee: " + emp.getName(), "HR", "/employees", emp.getDesignation() + " - " + emp.getDepartment())));

        productRepository.findAll().stream()
            .filter(p -> p.getProductName().toLowerCase().contains(q) || (p.getCategory() != null && p.getCategory().toLowerCase().contains(q)))
            .forEach(p -> results.add(new SearchResult("Product: " + p.getProductName(), "INVENTORY", "/products", "Stock: " + p.getQuantity() + " | Price: ₹" + p.getPrice())));

        customerRepository.findAll().stream()
            .filter(c -> c.getCustomerName().toLowerCase().contains(q) || (c.getEmail() != null && c.getEmail().toLowerCase().contains(q)))
            .forEach(c -> results.add(new SearchResult("Customer: " + c.getCustomerName(), "SALES", "/customers", "Email: " + c.getEmail() + " | Phone: " + c.getPhone())));

        salesOrderRepository.findAll().stream()
            .filter(o -> o.getCustomerName().toLowerCase().contains(q) || o.getProductName().toLowerCase().contains(q))
            .forEach(o -> results.add(new SearchResult("Sales Order: #" + o.getId() + " (" + o.getProductName() + ")", "SALES", "/sales", "Client: " + o.getCustomerName() + " | Total: ₹" + o.getTotalAmount())));

        if (results.size() > 8) {
            return results.subList(0, 8);
        }
        return results;
    }
}
