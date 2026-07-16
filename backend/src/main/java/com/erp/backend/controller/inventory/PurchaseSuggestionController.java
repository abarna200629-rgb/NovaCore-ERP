package com.erp.backend.controller.inventory;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.erp.backend.entity.inventory.Product;
import com.erp.backend.service.inventory.PurchaseSuggestionService;

@RestController
@RequestMapping("/api/inventory/purchase-suggestions")
@CrossOrigin("*")
public class PurchaseSuggestionController {

    @Autowired
    private PurchaseSuggestionService service;

    @GetMapping
    public List<Product> getSuggestions() {

        return service.getSuggestions();
    }
}