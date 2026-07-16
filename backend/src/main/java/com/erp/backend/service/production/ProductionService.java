package com.erp.backend.service.production;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.erp.backend.entity.inventory.Product;
import com.erp.backend.entity.production.Production;
import com.erp.backend.repository.inventory.ProductRepository;
import com.erp.backend.repository.production.ProductionRepository;

@Service
public class ProductionService {

    @Autowired
    private ProductionRepository productionRepository;

    @Autowired
    private ProductRepository productRepository;

    // CREATE PRODUCTION

    public Production saveProduction(
            Production production) {

        // If production completed
        if ("COMPLETED".equalsIgnoreCase(
                production.getStatus())) {

            Product product =
                    productRepository
                            .findByProductName(
                                    production.getProductName())
                            .orElse(null);

            if (product != null) {

                product.setQuantity(
                        product.getQuantity()
                                + production.getQuantity());

                productRepository.save(product);
            }
        }

        return productionRepository.save(
                production);
    }

    // GET ALL

    public List<Production> getAllProductions() {

        return productionRepository.findAll();
    }

    // GET BY ID

    public Production getProductionById(
            Long id) {

        return productionRepository
                .findById(id)
                .orElse(null);
    }


    public void completeProduction(Long productionId) {

        Production p = productionRepository.findById(productionId)
                .orElseThrow();

        Product product = productRepository
                .findByProductName(p.getProductName())
                .orElseThrow();

        product.setQuantity(
            product.getQuantity() + p.getQuantity()
        );

        productRepository.save(product);

        p.setStatus("COMPLETED");

        productionRepository.save(p);
    }

    // DELETE

    public void deleteProduction(
            Long id) {

        productionRepository.deleteById(id);
    }
}