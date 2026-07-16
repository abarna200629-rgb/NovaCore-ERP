package com.erp.backend.repository.sales;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.erp.backend.dto.SalesAnalyticsDTO;
import com.erp.backend.entity.sales.SalesOrder;

public interface SalesOrderRepository
        extends JpaRepository<SalesOrder, Long> {

    @Query("""
        SELECT new com.erp.backend.dto.SalesAnalyticsDTO(
        s.productName,
        SUM(s.quantity))
        FROM SalesOrder s
        GROUP BY s.productName
        ORDER BY SUM(s.quantity) DESC
    """)
    List<SalesAnalyticsDTO> getTopProducts();
    List<SalesOrder> findByCustomerId(Long customerId);
    java.util.Optional<SalesOrder> findByCustomerIdAndProductIdAndQuantityAndTotalAmountAndOrderDate(Long customerId, Long productId, java.lang.Integer quantity, java.lang.Double totalAmount, java.lang.String orderDate);
}