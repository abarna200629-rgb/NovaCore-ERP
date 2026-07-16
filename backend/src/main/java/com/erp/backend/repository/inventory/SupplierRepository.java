package com.erp.backend.repository.inventory;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.erp.backend.entity.inventory.Supplier;

public interface SupplierRepository extends JpaRepository<Supplier, Long> {
    Optional<Supplier> findByName(String name);
    Optional<Supplier> findByPhone(String phone);
}
