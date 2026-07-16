package com.erp.backend.service.inventory;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.erp.backend.entity.inventory.Product;
import com.erp.backend.repository.inventory.ProductRepository;

@Service
public class PurchaseSuggestionService {

    @Autowired
    private ProductRepository repository;

    public List<Product> getSuggestions() {

        return repository.findAll()
                .stream()
                .filter(product ->
                        product.getQuantity()
                                <= product.getMinStockLevel())
                .collect(Collectors.toList());
    }
}