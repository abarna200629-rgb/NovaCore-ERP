package com.erp.backend.repository.production;

import org.springframework.data.jpa.repository.JpaRepository;

import com.erp.backend.entity.production.Production;

public interface ProductionRepository
        extends JpaRepository<Production, Long> {

}