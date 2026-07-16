package com.erp.backend.service.sales;

import java.time.LocalDate;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.erp.backend.dto.SalesAnalyticsDTO;
import com.erp.backend.entity.Employee;
import com.erp.backend.entity.finance.Income;
import com.erp.backend.entity.inventory.Product;
import com.erp.backend.entity.sales.Customer;
import com.erp.backend.entity.sales.SalesOrder;
import com.erp.backend.entity.sales.SalesTarget;
import com.erp.backend.repository.EmployeeRepository;
import com.erp.backend.repository.inventory.ProductRepository;
import com.erp.backend.repository.sales.CustomerRepository;
import com.erp.backend.repository.sales.SalesOrderRepository;
import com.erp.backend.repository.sales.SalesTargetRepository;
import com.erp.backend.service.finance.IncomeService;
import com.erp.backend.service.inventory.InventoryAlertService;
import com.erp.backend.exception.DuplicateRecordException;

@Service
public class SalesOrderService {

    @Autowired
    private SalesOrderRepository repository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private SalesTargetRepository salesTargetRepository;

    @Autowired
    private IncomeService incomeService;

    @Autowired
    private InventoryAlertService alertService;

    @Autowired
    private com.erp.backend.service.performance.EmployeePerformanceService performanceService;

    // ===========================
    // SAVE SALES
    // ===========================

    public SalesOrder save(SalesOrder sales) {

        // 1. Employee Validation
        if (sales.getEmployeeId() == null) {
            throw new RuntimeException("Employee is required");
        }
        Employee employee = employeeRepository.findById(sales.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee Not Found"));
        if (!"ACTIVE".equalsIgnoreCase(employee.getStatus())) {
            throw new RuntimeException("Sales Order Error: Inactive employees cannot create sales orders!");
        }
        sales.setEmployeeName(employee.getName());

        // 2. Product Validation
        Product product = null;
        if (sales.getProductId() != null) {
            product = productRepository.findById(sales.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product Not Found"));
            sales.setProductName(product.getProductName());
        } else if (sales.getProductName() != null) {
            product = productRepository.findByProductName(sales.getProductName())
                    .orElseThrow(() -> new RuntimeException("Product Not Found"));
            sales.setProductId(product.getId());
        } else {
            throw new RuntimeException("Product is required");
        }

        // 3. Customer Validation
        if (sales.getCustomerId() == null && (sales.getCustomerName() == null || sales.getCustomerName().trim().isEmpty())) {
            throw new RuntimeException("Customer is required");
        }
        Customer customer = null;
        if (sales.getCustomerId() != null) {
            customer = customerRepository.findById(sales.getCustomerId())
                    .orElseThrow(() -> new RuntimeException("Customer Not Found"));
            sales.setCustomerName(customer.getCustomerName());
        } else if (sales.getCustomerName() != null) {
            String cName = sales.getCustomerName().trim();
            customer = customerRepository.findAll().stream()
                    .filter(c -> c.getCustomerName() != null && c.getCustomerName().equalsIgnoreCase(cName))
                    .findFirst()
                    .orElse(null);
            if (customer == null) {
                customer = new Customer();
                customer.setCustomerName(cName);
                customer = customerRepository.save(customer);
            }
            sales.setCustomerId(customer.getId());
        }

        // 4. Quantity Validation
        if (sales.getQuantity() == null || sales.getQuantity() <= 0) {
            throw new RuntimeException("Quantity must be greater than zero");
        }
        if (product.getQuantity() < sales.getQuantity()) {
            throw new RuntimeException("Insufficient Stock");
        }

        // 5. Auto Calculate Amount
        double subtotal = (product.getPrice() != null ? product.getPrice() : 0.0) * sales.getQuantity();
        double gstRate = product.getGst() != null ? product.getGst() : 0.0;
        double tax = subtotal * (gstRate / 100.0);
        sales.setTotalAmount(subtotal + tax);
        sales.setOrderDate(LocalDate.now().toString());
        sales.setStatus("PAID");

        // Duplicate Check
        if (sales.getCustomerId() != null && sales.getProductId() != null && sales.getQuantity() != null) {
            java.util.Optional<SalesOrder> dup = repository.findByCustomerIdAndProductIdAndQuantityAndTotalAmountAndOrderDate(
                sales.getCustomerId(), sales.getProductId(), sales.getQuantity(), sales.getTotalAmount(), sales.getOrderDate()
            );
            if (dup.isPresent()) {
                throw new DuplicateRecordException("Duplicate sales order detected.");
            }
        }

        // Reduce Stock
        product.setQuantity(product.getQuantity() - sales.getQuantity());
        productRepository.save(product);

        // Low Stock Alert
        if (product.getMinStockLevel() != null && product.getQuantity() <= product.getMinStockLevel()) {
            alertService.sendLowStockAlert(product.getProductName(), product.getQuantity());
        }

        // Save Sales
        SalesOrder savedSales = repository.save(sales);

        // Live Synchronization of Sales Targets & Performance
        performanceService.recalculateAll();

        Income income =
                new Income();

        income.setIncomeSource(
                "Sales - "
                        + sales.getProductName());

        income.setAmount(
                sales.getTotalAmount());

        income.setIncomeDate(
                LocalDate.now()
                        .toString());

        incomeService.saveIncome(
                income);

        return savedSales;
    }
    // =====================================
    // GET ALL SALES
    // =====================================

    public List<SalesOrder> getAll() {

        return repository.findAll();

    }

    // =====================================
    // SALES ANALYTICS
    // =====================================

    public List<SalesAnalyticsDTO> getTopProducts() {

        return repository.getTopProducts();

    }

    // =====================================
    // UPDATE SALES
    // =====================================

    public SalesOrder update(
            Long id,
            SalesOrder sales) {

        SalesOrder existing =
                repository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Sales Order Not Found"));

        // Restore old stock

        Product oldProduct =
                productRepository
                        .findByProductName(
                                existing.getProductName())
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Old Product Not Found"));

        oldProduct.setQuantity(

                oldProduct.getQuantity()
                        + existing.getQuantity()

        );

        productRepository.save(oldProduct);

        // Deduct new stock

        Product newProduct =
                productRepository
                        .findByProductName(
                                sales.getProductName())
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Product Not Found"));

        if (newProduct.getQuantity()
                < sales.getQuantity()) {

            throw new RuntimeException(
                    "Insufficient Stock");

        }

        newProduct.setQuantity(

                newProduct.getQuantity()
                        - sales.getQuantity()

        );

        productRepository.save(newProduct);

        // Update employee

        Employee employee =
                employeeRepository
                        .findById(
                                sales.getEmployeeId())
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Employee Not Found"));

        existing.setEmployeeId(
                employee.getId());

        existing.setEmployeeName(
                employee.getName());

        // Update values

        existing.setCustomerName(
                sales.getCustomerName());

        existing.setProductName(
                sales.getProductName());

        existing.setQuantity(
                sales.getQuantity());

        existing.setTotalAmount(
                sales.getTotalAmount());

        SalesOrder updatedSales = repository.save(existing);
        performanceService.recalculateAll();
        return updatedSales;
    }
    // =====================================
    // DELETE SALES
    // =====================================

    public void delete(Long id) {

        SalesOrder sales =
                repository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Sales Order Not Found"));

        // Restore Stock

        Product product =
                productRepository
                        .findByProductName(
                                sales.getProductName())
                        .orElse(null);

        if (product != null) {

            product.setQuantity(

                    product.getQuantity()
                            + sales.getQuantity()

            );

            productRepository.save(product);
        }

        // Live Synchronization of Sales Targets & Performance
        performanceService.recalculateAll();

        // -----------------------------
        // DELETE INCOME
        // -----------------------------

        incomeService.deleteIncomeBySource(
                "Sales - "
                        + sales.getProductName());

        repository.deleteById(id);
    }

    // =====================================
    // MIGRATE OLD CUSTOMERS
    // =====================================

    public void migrateSalesCustomers() {

        List<SalesOrder> salesList =
                repository.findAll();

        for (SalesOrder sale : salesList) {

            Customer customer =
                    customerRepository.findAll()
                            .stream()
                            .filter(c ->
                                    c.getCustomerName() != null &&
                                            c.getCustomerName()
                                                    .equalsIgnoreCase(
                                                            sale.getCustomerName()))
                            .findFirst()
                            .orElse(null);

            if (customer == null) {

                Customer newCustomer =
                        new Customer();

                newCustomer.setCustomerName(
                        sale.getCustomerName());

                customerRepository.save(
                        newCustomer);
            }
        }
    }

}