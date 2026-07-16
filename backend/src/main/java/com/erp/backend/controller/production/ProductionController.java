package com.erp.backend.controller.production;

import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.erp.backend.entity.production.Production;
import com.erp.backend.service.production.ProductionService;

import java.util.concurrent.CopyOnWriteArrayList;

@RestController
@RequestMapping("/api/production")
@CrossOrigin("*")
public class ProductionController {

    public static class RawMaterial {
        private Long id;
        private String name;
        private Double stock;
        private String unit;

        public RawMaterial() {}
        public RawMaterial(Long id, String name, Double stock, String unit) {
            this.id = id;
            this.name = name;
            this.stock = stock;
            this.unit = unit;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public Double getStock() { return stock; }
        public void setStock(Double stock) { this.stock = stock; }
        public String getUnit() { return unit; }
        public void setUnit(String unit) { this.unit = unit; }
    }

    public static class ProductionOrder {
        private Long id;
        private String productName;
        private Long rawMaterialId;
        private Double rawMaterialQty;
        private Integer quantity;
        private String machineStatus;
        private Double productionCost;
        private String status;
        private Boolean qcPassed;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getProductName() { return productName; }
        public void setProductName(String productName) { this.productName = productName; }
        public Long getRawMaterialId() { return rawMaterialId; }
        public void setRawMaterialId(Long rawMaterialId) { this.rawMaterialId = rawMaterialId; }
        public Double getRawMaterialQty() { return rawMaterialQty; }
        public void setRawMaterialQty(Double rawMaterialQty) { this.rawMaterialQty = rawMaterialQty; }
        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }
        public String getMachineStatus() { return machineStatus; }
        public void setMachineStatus(String machineStatus) { this.machineStatus = machineStatus; }
        public Double getProductionCost() { return productionCost; }
        public void setProductionCost(Double productionCost) { this.productionCost = productionCost; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public Boolean getQcPassed() { return qcPassed; }
        public void setQcPassed(Boolean qcPassed) { this.qcPassed = qcPassed; }
    }

    private static final List<RawMaterial> rawMaterialsList = new CopyOnWriteArrayList<>();
    private static final List<ProductionOrder> productionOrdersList = new CopyOnWriteArrayList<>();
    private static long nextRmId = 1;
    private static long nextOrderId = 1;

    static {
        rawMaterialsList.add(new RawMaterial(nextRmId++, "Silicon Wafer", 120.0, "pieces"));
        rawMaterialsList.add(new RawMaterial(nextRmId++, "Copper Coil", 450.0, "kg"));
        rawMaterialsList.add(new RawMaterial(nextRmId++, "Resin Compound", 80.0, "units"));
    }

    @GetMapping("/raw-materials")
    public List<RawMaterial> getRawMaterials() {
        return rawMaterialsList;
    }

    @PostMapping("/raw-materials")
    public RawMaterial addRawMaterial(@RequestBody RawMaterial rm) {
        rm.setId(nextRmId++);
        rawMaterialsList.add(rm);
        return rm;
    }

    @GetMapping("/orders")
    public List<ProductionOrder> getProductionOrders() {
        return productionOrdersList;
    }

    @PostMapping("/orders")
    public ProductionOrder addProductionOrder(@RequestBody ProductionOrder order) {
        order.setId(nextOrderId++);
        order.setStatus("PLANNING");
        order.setQcPassed(false);
        productionOrdersList.add(order);
        
        // Deduct raw material stock if found
        for (RawMaterial rm : rawMaterialsList) {
            if (rm.getId().equals(order.getRawMaterialId())) {
                rm.setStock(Math.max(0.0, rm.getStock() - order.getRawMaterialQty()));
                break;
            }
        }
        return order;
    }

    @PutMapping("/orders/machine/{id}")
    public ProductionOrder updateMachineStatus(@PathVariable Long id, @RequestParam String machineStatus) {
        for (ProductionOrder order : productionOrdersList) {
            if (order.getId().equals(id)) {
                order.setMachineStatus(machineStatus);
                if ("RUNNING".equals(machineStatus) && "PLANNING".equals(order.getStatus())) {
                    order.setStatus("IN_PROGRESS");
                }
                return order;
            }
        }
        return null;
    }

    @PutMapping("/orders/status/{id}")
    public ProductionOrder updateOrderStatus(@PathVariable Long id, @RequestParam String status) {
        for (ProductionOrder order : productionOrdersList) {
            if (order.getId().equals(id)) {
                order.setStatus(status);
                if ("QUALITY_CHECK".equals(status)) {
                    order.setQcPassed(true);
                }
                return order;
            }
        }
        return null;
    }

    @Autowired
    private ProductionService productionService;

    // Create Production
    @PostMapping
    public Production createProduction(
            @RequestBody Production production) {

        return productionService.saveProduction(production);
    }

    // Get All Productions
    @PreAuthorize("hasAnyRole('ADMIN','INVENTORY','PRODUCTION')")
    @GetMapping
    public List<Production> getAllProductions() {

        return productionService.getAllProductions();
    }

    // Get Production By Id
    @GetMapping("/{id}")
    public Production getProductionById(
            @PathVariable Long id) {

        return productionService.getProductionById(id);
    }
    @PostMapping("/complete/{id}")
    public String complete(@PathVariable Long id) {
        productionService.completeProduction(id);
        return "Production Completed & Stock Updated";
    }

    // Delete Production
    @DeleteMapping("/{id}")
    public String deleteProduction(
            @PathVariable Long id) {

        productionService.deleteProduction(id);

        return "Production Deleted Successfully";
    }
}