package com.erp.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.erp.backend.entity.ScannedDocument;

public interface ScannedDocumentRepository extends JpaRepository<ScannedDocument, Long> {
}
