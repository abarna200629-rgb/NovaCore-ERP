package com.erp.backend.controller.sales;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.erp.backend.entity.sales.CRMLead;
import com.erp.backend.repository.sales.CRMLeadRepository;
import com.erp.backend.service.AuditLogService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/sales/crm")
@CrossOrigin("*")
public class CRMController {

    @Autowired
    private CRMLeadRepository repository;

    @Autowired
    private AuditLogService auditLogService;

    @GetMapping
    public List<CRMLead> getAllLeads() {
        return repository.findAll();
    }

    @PostMapping
    public CRMLead saveLead(@Valid @RequestBody CRMLead lead) {
        if (lead.getStatus() == null) {
            lead.setStatus("LEAD");
        }
        if (lead.getPipelineStage() == null) {
            lead.setPipelineStage("Qualification");
        }
        CRMLead saved = repository.save(lead);
        auditLogService.saveLog(null, "Created CRM Lead ID " + saved.getId() + " for " + saved.getCompanyName(), "CRM");
        return saved;
    }

    @GetMapping("/{id}")
    public CRMLead getLeadById(@PathVariable Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lead not found with id: " + id));
    }

    @PutMapping("/{id}")
    public CRMLead updateLead(@PathVariable Long id, @Valid @RequestBody CRMLead leadDetails) {
        CRMLead lead = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lead not found with id: " + id));
        
        lead.setCompanyName(leadDetails.getCompanyName());
        lead.setContactName(leadDetails.getContactName());
        lead.setEmail(leadDetails.getEmail());
        lead.setPhone(leadDetails.getPhone());
        lead.setStatus(leadDetails.getStatus());
        lead.setDealValue(leadDetails.getDealValue());
        lead.setPipelineStage(leadDetails.getPipelineStage());
        lead.setNotes(leadDetails.getNotes());
        lead.setReminderDate(leadDetails.getReminderDate());
        lead.setReminderText(leadDetails.getReminderText());
        
        CRMLead updated = repository.save(lead);
        auditLogService.saveLog(null, "Updated CRM Lead ID " + id + " (" + updated.getCompanyName() + ")", "CRM");
        return updated;
    }

    @DeleteMapping("/{id}")
    public String deleteLead(@PathVariable Long id) {
        CRMLead lead = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lead not found with id: " + id));
        repository.delete(lead);
        auditLogService.saveLog(null, "Deleted CRM Lead ID " + id + " (" + lead.getCompanyName() + ")", "CRM");
        return "Lead deleted successfully";
    }
}
