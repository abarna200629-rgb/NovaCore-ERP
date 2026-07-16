package com.erp.backend.entity.inventory;

import jakarta.persistence.*;

@Entity
@Table(name = "suppliers")
public class Supplier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String phone;
    private String city;
    private String rating;
    private Double performanceScore;
    private Integer purchaseHistoryCount;
    private Integer deliveryHistoryCount;
    private Integer pendingOrdersCount;

    public Supplier() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getRating() {
        return rating;
    }

    public void setRating(String rating) {
        this.rating = rating;
    }

    public Double getPerformanceScore() {
        return performanceScore;
    }

    public void setPerformanceScore(Double performanceScore) {
        this.performanceScore = performanceScore;
    }

    public Integer getPurchaseHistoryCount() {
        return purchaseHistoryCount;
    }

    public void setPurchaseHistoryCount(Integer purchaseHistoryCount) {
        this.purchaseHistoryCount = purchaseHistoryCount;
    }

    public Integer getDeliveryHistoryCount() {
        return deliveryHistoryCount;
    }

    public void setDeliveryHistoryCount(Integer deliveryHistoryCount) {
        this.deliveryHistoryCount = deliveryHistoryCount;
    }

    public Integer getPendingOrdersCount() {
        return pendingOrdersCount;
    }

    public void setPendingOrdersCount(Integer pendingOrdersCount) {
        this.pendingOrdersCount = pendingOrdersCount;
    }
}
