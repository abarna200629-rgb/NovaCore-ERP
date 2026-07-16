package com.erp.backend.controller.inventory;

import java.util.List;
import java.time.LocalDate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.erp.backend.entity.inventory.Product;
import com.erp.backend.entity.inventory.PurchaseRequest;
import com.erp.backend.repository.inventory.PurchaseRequestRepository;
import com.erp.backend.repository.inventory.ProductRepository;
import com.erp.backend.entity.finance.Expense;
import com.erp.backend.service.finance.ExpenseService;
import com.erp.backend.service.auth.MailService;
import com.erp.backend.service.inventory.ProductService;
import com.erp.backend.service.AuditLogService;

@RestController
@RequestMapping("/api/inventory")
@CrossOrigin("*")
public class ProductController {

    @Autowired
    private PurchaseRequestRepository purchaseRequestRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ExpenseService expenseService;

    @Autowired
    private MailService mailService;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private ProductService service;

    @GetMapping("/purchases")
    public List<PurchaseRequest> getPurchases() {
        // Seed initial data in database if empty to ensure initial data presence
        if (purchaseRequestRepository.count() == 0) {
            purchaseRequestRepository.save(new PurchaseRequest(null, "Silicon Wafer", 50, 25000.0, "Inventory Manager", "PENDING"));
            purchaseRequestRepository.save(new PurchaseRequest(null, "Copper wire spool", 20, 14000.0, "Production Lead", "APPROVED"));
        }
        return purchaseRequestRepository.findAll();
    }

    @PostMapping("/purchases")
    public PurchaseRequest createPurchase(@RequestBody PurchaseRequest req) {
        req.setStatus("PENDING");
        if (req.getRequestedBy() == null || req.getRequestedBy().isEmpty()) {
            req.setRequestedBy("Inventory Manager");
        }
        req.setOrderDate(LocalDate.now().toString());
        PurchaseRequest saved = purchaseRequestRepository.save(req);
        auditLogService.saveLog(null, "Created Purchase Request for: " + req.getProductName() + " (Qty: " + req.getQuantity() + ")", "INVENTORY");
        
        // Notify of PO creation
        mailService.sendAlertMail("erpmanagement2028@gmail.com", 
                "New Purchase Request - " + req.getProductName(), 
                "A new purchase request has been submitted for " + req.getQuantity() + " units of " + req.getProductName() + " (Estimated: ₹" + req.getPrice() + ").");
        
        return saved;
    }

    @PutMapping("/purchases/approve/{id}")
    public PurchaseRequest approvePurchase(@PathVariable Long id, @RequestParam(required = false) String approver) {
        PurchaseRequest req = purchaseRequestRepository.findById(id).orElse(null);
        if (req != null) {
            req.setStatus("APPROVED");
            PurchaseRequest saved = purchaseRequestRepository.save(req);
            auditLogService.saveLog(null, "Approved Purchase Order: PO-" + id + " for " + req.getProductName(), "INVENTORY");
            
            // Email Alert for Approved PO
            mailService.sendAlertMail("erpmanagement2028@gmail.com",
                    "Purchase Order Approved: PO-" + id,
                    "Purchase Order PO-" + id + " for " + req.getProductName() + " has been APPROVED by " + (approver != null ? approver : "Finance Manager") + ".");
            return saved;
        }
        return null;
    }

    @PutMapping("/purchases/reject/{id}")
    public PurchaseRequest rejectPurchase(@PathVariable Long id, @RequestParam(required = false) String rejector) {
        PurchaseRequest req = purchaseRequestRepository.findById(id).orElse(null);
        if (req != null) {
            req.setStatus("REJECTED");
            PurchaseRequest saved = purchaseRequestRepository.save(req);
            auditLogService.saveLog(null, "Rejected Purchase Order: PO-" + id, "INVENTORY");
            
            // Email Alert for Rejected PO
            mailService.sendAlertMail("erpmanagement2028@gmail.com",
                    "Purchase Order Rejected: PO-" + id,
                    "Purchase Order PO-" + id + " for " + req.getProductName() + " has been REJECTED by " + (rejector != null ? rejector : "Finance Manager") + ".");
            return saved;
        }
        return null;
    }

    @PutMapping("/purchases/receive/{id}")
    public PurchaseRequest receivePurchase(@PathVariable Long id) {
        PurchaseRequest req = purchaseRequestRepository.findById(id).orElse(null);
        if (req != null && !"RECEIVED".equals(req.getStatus())) {
            req.setStatus("RECEIVED");
            PurchaseRequest saved = purchaseRequestRepository.save(req);

            // Increment Stock level of target Product
            Product prod = productRepository.findByProductName(req.getProductName()).orElse(null);
            if (prod != null) {
                prod.setQuantity(prod.getQuantity() + req.getQuantity());
                productRepository.save(prod);
            }

            // Log general ledger Expense entry automatically
            Expense exp = new Expense();
            exp.setExpenseName("PO-" + id + " - " + req.getProductName());
            exp.setAmount(req.getPrice());
            exp.setExpenseDate(LocalDate.now().toString());
            expenseService.saveExpense(exp);

            auditLogService.saveLog(null, "Received goods and logged expense for PO-" + id + " (" + req.getProductName() + ")", "INVENTORY");
            return saved;
        }
        return req;
    }

    // CREATE PRODUCT
    @PostMapping("/products")
    public Product addProduct(@RequestBody Product product) {
        return service.saveProduct(product);
    }

    // GET ALL PRODUCTS
    @GetMapping("/products")
    public List<Product> getAllProducts() {
        return service.getAllProducts();
    }

    // GET BY ID
    @GetMapping("/products/{id}")
    public Product getProduct(@PathVariable Long id) {
        return service.getProductById(id);
    }

    // AVAILABLE PRODUCTS
    @GetMapping("/products/available")
    public List<Product> getAvailableProducts() {
        return service.getAvailableProducts();
    }

    // 🔥 LOW STOCK API (IMPORTANT)
    @GetMapping("/products/low-stock")
    public List<Product> getLowStockProducts() {
        return service.getLowStockProducts();
    }

    // DELETE
    @DeleteMapping("/products/{id}")
    public String deleteProduct(@PathVariable Long id) {
        service.deleteProduct(id);
        return "Product Deleted";
    }

    @PutMapping("/products/{id}")
    public Product updateProduct(@PathVariable Long id, @RequestBody Product product) {
        product.setId(id);
        return service.saveProduct(product);
    }

    @GetMapping("/products/scan")
    public Product scanProduct(@RequestParam String code) {
        return service.scanProduct(code);
    }

    @PostMapping("/products/scan/image")
    public Product scanProductImage(@RequestBody java.util.Map<String, String> body) throws Exception {
        String base64Image = body.get("image");
        if (base64Image == null) return null;
        if (base64Image.contains(",")) {
            base64Image = base64Image.split(",")[1];
        }
        byte[] bytes = java.util.Base64.getDecoder().decode(base64Image);
        java.io.ByteArrayInputStream bis = new java.io.ByteArrayInputStream(bytes);
        java.awt.image.BufferedImage bufferedImage = javax.imageio.ImageIO.read(bis);
        if (bufferedImage == null) return null;
        
        com.google.zxing.LuminanceSource source = new com.google.zxing.client.j2se.BufferedImageLuminanceSource(bufferedImage);
        com.google.zxing.BinaryBitmap bitmap = new com.google.zxing.BinaryBitmap(new com.google.zxing.common.HybridBinarizer(source));
        
        try {
            com.google.zxing.Result result = new com.google.zxing.qrcode.QRCodeReader().decode(bitmap);
            return service.scanProduct(result.getText());
        } catch (Exception e) {
            try {
                com.google.zxing.Result result = new com.google.zxing.MultiFormatReader().decode(bitmap);
                return service.scanProduct(result.getText());
            } catch (Exception ex) {
                return null;
            }
        }
    }

    @GetMapping("/products/{id}/stock-history")
    public List<com.erp.backend.entity.inventory.StockMovement> getStockHistory(@PathVariable Long id) {
        return service.getStockHistory(id);
    }

    @GetMapping(value = "/products/{id}/barcode", produces = org.springframework.http.MediaType.IMAGE_PNG_VALUE)
    public byte[] getProductBarcode(@PathVariable Long id) throws Exception {
        Product p = service.getProductById(id);
        String barcodeValue = (p != null && p.getBarcode() != null) ? p.getBarcode() : "890120000000";
        return generateBarcodeImage(barcodeValue);
    }

    @GetMapping(value = "/products/{id}/qrcode", produces = org.springframework.http.MediaType.IMAGE_PNG_VALUE)
    public byte[] getProductQrCode(@PathVariable Long id) throws Exception {
        Product p = service.getProductById(id);
        if (p == null) {
            return generateQRCodeImage("No Product");
        }
        String qrContent = String.format(
            "{\"id\":%d,\"name\":\"%s\",\"sku\":\"%s\",\"price\":%.2f,\"warehouse\":\"%s\"}",
            p.getId(),
            p.getProductName() != null ? p.getProductName().replace("\"", "\\\"") : "",
            p.getSku() != null ? p.getSku().replace("\"", "\\\"") : "",
            p.getPrice() != null ? p.getPrice() : 0.0,
            p.getWarehouse() != null ? p.getWarehouse().replace("\"", "\\\"") : ""
        );
        return generateQRCodeImage(qrContent);
    }

    private byte[] generateBarcodeImage(String text) throws Exception {
        com.google.zxing.oned.Code128Writer writer = new com.google.zxing.oned.Code128Writer();
        com.google.zxing.common.BitMatrix bitMatrix = writer.encode(text, com.google.zxing.BarcodeFormat.CODE_128, 250, 80);
        java.io.ByteArrayOutputStream bos = new java.io.ByteArrayOutputStream();
        com.google.zxing.client.j2se.MatrixToImageWriter.writeToStream(bitMatrix, "PNG", bos);
        return bos.toByteArray();
    }

    private byte[] generateQRCodeImage(String text) throws Exception {
        com.google.zxing.qrcode.QRCodeWriter writer = new com.google.zxing.qrcode.QRCodeWriter();
        com.google.zxing.common.BitMatrix bitMatrix = writer.encode(text, com.google.zxing.BarcodeFormat.QR_CODE, 200, 200);
        java.io.ByteArrayOutputStream bos = new java.io.ByteArrayOutputStream();
        com.google.zxing.client.j2se.MatrixToImageWriter.writeToStream(bitMatrix, "PNG", bos);
        return bos.toByteArray();
    }

    @PostMapping("/products/{id}/stock-in")
    public Product stockIn(@PathVariable Long id, @RequestBody java.util.Map<String, Object> body) {
        Number qtyNum = (Number) body.get("quantity");
        int quantity = qtyNum != null ? qtyNum.intValue() : 0;
        String reason = (String) body.get("reason");
        String notes = (String) body.get("notes");
        return service.stockIn(id, quantity, reason, notes);
    }

    @PostMapping("/products/{id}/stock-out")
    public Product stockOut(@PathVariable Long id, @RequestBody java.util.Map<String, Object> body) {
        Number qtyNum = (Number) body.get("quantity");
        int quantity = qtyNum != null ? qtyNum.intValue() : 0;
        String reason = (String) body.get("reason");
        String notes = (String) body.get("notes");
        return service.stockOut(id, quantity, reason, notes);
    }

    @PostMapping("/products/{id}/transfer")
    public Product transferStock(@PathVariable Long id, @RequestBody java.util.Map<String, Object> body) {
        String destWarehouse = (String) body.get("destinationWarehouse");
        Number qtyNum = (Number) body.get("quantity");
        int quantity = qtyNum != null ? qtyNum.intValue() : 0;
        return service.transferStock(id, destWarehouse, quantity);
    }
}