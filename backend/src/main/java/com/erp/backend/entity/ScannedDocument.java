package com.erp.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "scanned_documents")
public class ScannedDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fileName;
    private String documentType; // "Invoice", "Purchase Bill", "Medical Certificate"
    
    private String extractedName;
    private String extractedDate;
    private Double extractedAmount;
    private String extractedVendor;
    private String extractedInvoiceNumber;
    
    private String status; // "PROCESSED", "AUTO_FILLED"
    private LocalDateTime createdAt;

    public ScannedDocument() {
        this.createdAt = LocalDateTime.now();
        this.status = "PROCESSED";
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getDocumentType() { return documentType; }
    public void setDocumentType(String documentType) { this.documentType = documentType; }

    public String getExtractedName() { return extractedName; }
    public void setExtractedName(String extractedName) { this.extractedName = extractedName; }

    public String getExtractedDate() { return extractedDate; }
    public void setExtractedDate(String extractedDate) { this.extractedDate = extractedDate; }

    public Double getExtractedAmount() { return extractedAmount; }
    public void setExtractedAmount(Double extractedAmount) { this.extractedAmount = extractedAmount; }

    public String getExtractedVendor() { return extractedVendor; }
    public void setExtractedVendor(String extractedVendor) { this.extractedVendor = extractedVendor; }

    public String getExtractedInvoiceNumber() { return extractedInvoiceNumber; }
    public void setExtractedInvoiceNumber(String extractedInvoiceNumber) { this.extractedInvoiceNumber = extractedInvoiceNumber; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
