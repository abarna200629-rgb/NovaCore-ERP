package com.erp.backend.repository.inventory;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.erp.backend.entity.inventory.Product;

public interface ProductRepository extends JpaRepository<Product, Long> {

    Optional<Product> findByProductName(String productName);

    Long countByQuantityLessThan(Integer quantity);

    Optional<Product> findByBarcode(String barcode);

    Optional<Product> findByQrCode(String qrCode);

    Optional<Product> findByProductNameAndCategoryAndWarehouse(String productName, String category, String warehouse);
}