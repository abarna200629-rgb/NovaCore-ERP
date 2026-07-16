package com.erp.backend.entity.sales;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

@Entity
@Table(name = "crm_leads")
public class CRMLead {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Company name is required")
    private String companyName;

    @NotBlank(message = "Contact name is required")
    private String contactName;
    private String email;
    private String phone;
    private String status; // "LEAD", "OPPORTUNITY", "DEAL"
    private Double dealValue;
    private String pipelineStage; // "Qualification", "Proposal", "Negotiation", "Won", "Lost"
    
    @Column(columnDefinition = "TEXT")
    private String notes;
    
    private String reminderDate; // e.g. "2026-07-15"
    private String reminderText;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }

    public String getContactName() { return contactName; }
    public void setContactName(String contactName) { this.contactName = contactName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Double getDealValue() { return dealValue; }
    public void setDealValue(Double dealValue) { this.dealValue = dealValue; }

    public String getPipelineStage() { return pipelineStage; }
    public void setPipelineStage(String pipelineStage) { this.pipelineStage = pipelineStage; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getReminderDate() { return reminderDate; }
    public void setReminderDate(String reminderDate) { this.reminderDate = reminderDate; }

    public String getReminderText() { return reminderText; }
    public void setReminderText(String reminderText) { this.reminderText = reminderText; }
}
