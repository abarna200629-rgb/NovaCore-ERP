package com.erp.backend.service.inventory;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.erp.backend.entity.inventory.Product;
import com.erp.backend.repository.inventory.ProductRepository;
import com.erp.backend.repository.inventory.StockMovementRepository;
import com.erp.backend.entity.inventory.StockMovement;
import com.erp.backend.service.AuditLogService;
import com.erp.backend.exception.DuplicateRecordException;
import java.time.LocalDateTime;

@Service
public class ProductService {

    @Autowired
    private ProductRepository repository;

    @Autowired
    private StockMovementRepository stockMovementRepository;

    @Autowired
    private InventoryAlertService alertService;

    @Autowired
    private AuditLogService auditLogService;

    // CREATE PRODUCT
    public Product saveProduct(Product product) {
        boolean isNew = product.getId() == null;
        int qtyChange = 0;
        Product existingProduct = null;

        // Fetch existing if editing
        if (!isNew) {
            existingProduct = repository.findById(product.getId()).orElse(null);
            if (existingProduct != null) {
                qtyChange = product.getQuantity() - existingProduct.getQuantity();
                product.setCreatedDate(existingProduct.getCreatedDate());
            }
        } else {
            product.setCreatedDate(LocalDateTime.now());
            qtyChange = product.getQuantity() != null ? product.getQuantity() : 0;
        }
        product.setLastUpdated(LocalDateTime.now());

        // Validate duplicates
        if (product.getBarcode() != null && !product.getBarcode().trim().isEmpty()) {
            String bc = product.getBarcode().trim();
            Product found = repository.findByBarcode(bc).orElse(null);
            if (found != null && (isNew || !found.getId().equals(product.getId()))) {
                throw new DuplicateRecordException("SKU/Barcode already exists.");
            }
        }
        if (product.getProductName() != null && !product.getProductName().trim().isEmpty() &&
            product.getCategory() != null && !product.getCategory().trim().isEmpty() &&
            product.getWarehouse() != null && !product.getWarehouse().trim().isEmpty()) {
            
            String name = product.getProductName().trim();
            String cat = product.getCategory().trim();
            String wh = product.getWarehouse().trim();
            Product found = repository.findByProductNameAndCategoryAndWarehouse(name, cat, wh).orElse(null);
            if (found != null && (isNew || !found.getId().equals(product.getId()))) {
                throw new DuplicateRecordException("Product already exists in this warehouse.");
            }
        }

        if (product.getQuantity() == null) {
            product.setQuantity(0);
        }
        if (product.getMinStockLevel() == null) {
            product.setMinStockLevel(0);
        }
        if (product.getSku() == null || product.getSku().trim().isEmpty()) {
            product.setSku("SKU-" + String.format("%04d", (int)(Math.random() * 10000)) + "-" + String.format("%04d", (int)(Math.random() * 10000)));
        }
        if (product.getBarcode() == null || product.getBarcode().trim().isEmpty()) {
            product.setBarcode("89012" + String.format("%07d", (int)(Math.random() * 10000000)));
        }
        if (product.getQrCode() == null || product.getQrCode().trim().isEmpty()) {
            product.setQrCode("PROD-QR-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }

        Product saved = repository.save(product);

        // Save Stock Movement history
        if (isNew) {
            stockMovementRepository.save(new StockMovement(saved.getId(), saved.getProductName(), saved.getQuantity(), "IN", "Initial product registration"));
        } else if (qtyChange != 0) {
            String act = qtyChange > 0 ? "IN" : "OUT";
            stockMovementRepository.save(new StockMovement(saved.getId(), saved.getProductName(), Math.abs(qtyChange), act, "Stock level manually updated"));
        }

        auditLogService.saveLog(
                "INVENTORY_USER",
                (isNew ? "Added Product : " : "Updated Product : ") + product.getProductName(),
                "INVENTORY");

        if (saved.getMinStockLevel() != null && saved.getQuantity() != null &&
                saved.getQuantity() <= saved.getMinStockLevel()) {

            alertService.sendLowStockAlert(
                    saved.getProductName(),
                    saved.getQuantity());
        }

        return saved;
    }

    // GET ALL PRODUCTS
    public List<Product> getAllProducts() {
        return repository.findAll();
    }

    // AVAILABLE PRODUCTS
    public List<Product> getAvailableProducts() {

        return repository.findAll()
                .stream()
                .filter(p ->
                        p.getQuantity() != null &&
                        p.getQuantity() > 0)
                .collect(Collectors.toList());
    }

    // LOW STOCK
    public List<Product> getLowStockProducts() {

        return repository.findAll()
                .stream()
                .filter(p ->
                        p.getMinStockLevel() != null &&
                        p.getQuantity() <= p.getMinStockLevel())
                .collect(Collectors.toList());
    }

    // GET BY ID
    public Product getProductById(Long id) {

        return repository.findById(id)
                .orElse(null);
    }

    // DELETE
    public void deleteProduct(Long id) {

        Product product =
                repository.findById(id)
                        .orElse(null);

        if (product != null) {

            auditLogService.saveLog(
                    "INVENTORY_USER",
                    "Deleted Product : " + product.getProductName(),
                    "INVENTORY");
        }

        repository.deleteById(id);
    }

    public List<StockMovement> getStockHistory(Long productId) {
        return stockMovementRepository.findByProductIdOrderByTimestampDesc(productId);
    }

    public Product scanProduct(String code) {
        // Try decoding if JSON string
        String lookupCode = code;
        if (code.trim().startsWith("{") && code.trim().endsWith("}")) {
            try {
                // simple manual JSON parse for ID
                int idIdx = code.indexOf("\"id\"");
                if (idIdx != -1) {
                    int colonIdx = code.indexOf(":", idIdx);
                    int commaIdx = code.indexOf(",", colonIdx);
                    if (commaIdx == -1) commaIdx = code.indexOf("}", colonIdx);
                    String idStr = code.substring(colonIdx + 1, commaIdx).trim().replace("\"", "");
                    lookupCode = idStr;
                }
            } catch (Exception e) {
                // fallback to literal
            }
        }

        final String finalCode = lookupCode;
        Product product = repository.findByQrCode(finalCode)
                .orElseGet(() -> repository.findByBarcode(finalCode)
                .orElseGet(() -> {
                    try {
                        Long id = Long.parseLong(finalCode);
                        return repository.findById(id).orElse(null);
                    } catch (NumberFormatException e) {
                        return null;
                    }
                }));

        if (product != null) {
            // log the scan activity
            stockMovementRepository.save(new StockMovement(
                product.getId(),
                product.getProductName(),
                1,
                "OUT",
                "Product QR Code Scanned via Mobile/Webcam Scanner"
            ));
            auditLogService.saveLog("INVENTORY_USER", "Scanned Product QR Code: " + product.getProductName(), "INVENTORY");
        }
        return product;
    }

    public Product stockIn(Long id, int quantity, String reason, String notes) {
        Product product = repository.findById(id).orElse(null);
        if (product == null) return null;
        product.setQuantity((product.getQuantity() != null ? product.getQuantity() : 0) + quantity);
        product.setLastUpdated(LocalDateTime.now());
        Product saved = repository.save(product);
        stockMovementRepository.save(new StockMovement(id, saved.getProductName(), quantity, "IN", "Reason: " + reason + (notes != null && !notes.isEmpty() ? " | Notes: " + notes : "")));
        auditLogService.saveLog("INVENTORY_USER", "Stock In for product: " + saved.getProductName() + " (Qty: " + quantity + ", Reason: " + reason + ")", "INVENTORY");
        return saved;
    }

    public Product stockOut(Long id, int quantity, String reason, String notes) {
        Product product = repository.findById(id).orElse(null);
        if (product == null) return null;
        int currentQty = product.getQuantity() != null ? product.getQuantity() : 0;
        product.setQuantity(Math.max(0, currentQty - quantity));
        product.setLastUpdated(LocalDateTime.now());
        Product saved = repository.save(product);
        stockMovementRepository.save(new StockMovement(id, saved.getProductName(), quantity, "OUT", "Reason: " + reason + (notes != null && !notes.isEmpty() ? " | Notes: " + notes : "")));
        auditLogService.saveLog("INVENTORY_USER", "Stock Out for product: " + saved.getProductName() + " (Qty: " + quantity + ", Reason: " + reason + ")", "INVENTORY");
        return saved;
    }

    public Product transferStock(Long id, String destWarehouse, int quantity) {
        Product srcProduct = repository.findById(id).orElse(null);
        if (srcProduct == null) return null;
        int currentQty = srcProduct.getQuantity() != null ? srcProduct.getQuantity() : 0;
        if (currentQty < quantity) {
            throw new IllegalArgumentException("Insufficient stock in source warehouse!");
        }

        // Deduct from source
        srcProduct.setQuantity(currentQty - quantity);
        srcProduct.setLastUpdated(LocalDateTime.now());
        repository.save(srcProduct);

        // Log movement for source
        stockMovementRepository.save(new StockMovement(
            srcProduct.getId(),
            srcProduct.getProductName(),
            quantity,
            "OUT",
            "Transferred to " + destWarehouse
        ));

        // Find or create product at destination warehouse
        Product destProduct = repository.findByProductNameAndCategoryAndWarehouse(srcProduct.getProductName(), srcProduct.getCategory(), destWarehouse)
            .orElse(null);

        if (destProduct != null) {
            destProduct.setQuantity((destProduct.getQuantity() != null ? destProduct.getQuantity() : 0) + quantity);
            destProduct.setLastUpdated(LocalDateTime.now());
            repository.save(destProduct);

            stockMovementRepository.save(new StockMovement(
                destProduct.getId(),
                destProduct.getProductName(),
                quantity,
                "IN",
                "Transferred from " + srcProduct.getWarehouse()
            ));
        } else {
            Product newProduct = new Product();
            newProduct.setProductName(srcProduct.getProductName());
            newProduct.setCategory(srcProduct.getCategory());
            newProduct.setSupplier(srcProduct.getSupplier());
            newProduct.setPurchasePrice(srcProduct.getPurchasePrice());
            newProduct.setPrice(srcProduct.getPrice());
            newProduct.setGst(srcProduct.getGst());
            newProduct.setWarehouse(destWarehouse);
            newProduct.setQuantity(quantity);
            newProduct.setMinStockLevel(srcProduct.getMinStockLevel());
            newProduct.setExpiryDate(srcProduct.getExpiryDate());
            newProduct.setBatchNumber(srcProduct.getBatchNumber());
            newProduct.setBarcode(srcProduct.getBarcode());
            newProduct.setQrCode(srcProduct.getQrCode());
            newProduct.setSku(srcProduct.getSku());
            newProduct.setCreatedDate(LocalDateTime.now());
            newProduct.setLastUpdated(LocalDateTime.now());
            Product savedDest = repository.save(newProduct);

            stockMovementRepository.save(new StockMovement(
                savedDest.getId(),
                savedDest.getProductName(),
                quantity,
                "IN",
                "Transferred from " + srcProduct.getWarehouse()
            ));
        }

        auditLogService.saveLog("INVENTORY_USER", "Transferred stock of: " + srcProduct.getProductName() + " (Qty: " + quantity + " from " + srcProduct.getWarehouse() + " to " + destWarehouse + ")", "INVENTORY");
        return srcProduct;
    }
}