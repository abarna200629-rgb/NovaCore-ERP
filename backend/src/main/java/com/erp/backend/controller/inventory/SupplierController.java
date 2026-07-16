package com.erp.backend.controller.inventory;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.erp.backend.entity.inventory.Supplier;
import com.erp.backend.repository.inventory.SupplierRepository;
import com.erp.backend.service.AuditLogService;
import com.erp.backend.exception.DuplicateRecordException;
import java.util.Optional;

@RestController
@RequestMapping("/api/inventory/suppliers")
@CrossOrigin("*")
public class SupplierController {

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private AuditLogService auditLogService;

    @GetMapping
    public List<Supplier> getAllSuppliers() {
        return supplierRepository.findAll();
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN', 'INVENTORY', 'ROLE_INVENTORY')")
    public Supplier registerSupplier(@RequestBody Supplier supplier) {
        // Validate duplicates
        if (supplier.getPhone() != null && !supplier.getPhone().trim().isEmpty()) {
            String ph = supplier.getPhone().trim();
            if (supplierRepository.findByPhone(ph).isPresent()) {
                throw new DuplicateRecordException("Phone Number already exists.");
            }
        }
        if (supplier.getName() != null && !supplier.getName().trim().isEmpty()) {
            String name = supplier.getName().trim();
            if (supplierRepository.findByName(name).isPresent()) {
                throw new DuplicateRecordException("Supplier Name already exists.");
            }
        }

        if (supplier.getPerformanceScore() == null) {
            supplier.setPerformanceScore(90.0);
        }
        if (supplier.getPurchaseHistoryCount() == null) {
            supplier.setPurchaseHistoryCount(0);
        }
        if (supplier.getDeliveryHistoryCount() == null) {
            supplier.setDeliveryHistoryCount(0);
        }
        if (supplier.getPendingOrdersCount() == null) {
            supplier.setPendingOrdersCount(0);
        }
        Supplier saved = supplierRepository.save(supplier);
        auditLogService.saveLog(null, "Registered Supplier: " + supplier.getName(), "INVENTORY");
        return saved;
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN', 'INVENTORY', 'ROLE_INVENTORY')")
    public Supplier updateSupplier(@PathVariable Long id, @RequestBody Supplier details) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Supplier not found"));

        // Validate duplicates for update
        if (details.getPhone() != null && !details.getPhone().trim().isEmpty()) {
            String ph = details.getPhone().trim();
            Optional<Supplier> dup = supplierRepository.findByPhone(ph);
            if (dup.isPresent() && !dup.get().getId().equals(id)) {
                throw new DuplicateRecordException("Phone Number already exists.");
            }
        }
        if (details.getName() != null && !details.getName().trim().isEmpty()) {
            String name = details.getName().trim();
            Optional<Supplier> dup = supplierRepository.findByName(name);
            if (dup.isPresent() && !dup.get().getId().equals(id)) {
                throw new DuplicateRecordException("Supplier Name already exists.");
            }
        }

        supplier.setName(details.getName());
        supplier.setPhone(details.getPhone());
        supplier.setCity(details.getCity());
        supplier.setRating(details.getRating());
        if (details.getPerformanceScore() != null) {
            supplier.setPerformanceScore(details.getPerformanceScore());
        }
        Supplier saved = supplierRepository.save(supplier);
        auditLogService.saveLog(null, "Updated Supplier details: " + supplier.getName(), "INVENTORY");
        return saved;
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN', 'INVENTORY', 'ROLE_INVENTORY')")
    public String deleteSupplier(@PathVariable Long id) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Supplier not found"));
        supplierRepository.delete(supplier);
        auditLogService.saveLog(null, "Deleted Supplier: " + supplier.getName(), "INVENTORY");
        return "Supplier deleted successfully";
    }
}
