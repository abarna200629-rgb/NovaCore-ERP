package com.erp.backend.dto.finance;

import java.util.List;

public class CreditScoreDTO {
    private Long customerId;
    private String customerName;
    private Integer creditScore;
    private String riskLevel;
    private Double totalPurchases;
    private Integer purchaseFrequency;
    private Integer completedOrders;
    private Integer cancelledOrders;
    private Double averageInvoiceValue;
    private Double outstandingBalance;
    private Integer overduePayments;
    private Integer averagePaymentDelay;
    private Double creditLimit;
    private Double availableCredit;
    private String aiRecommendation;
    private String paymentBehaviourSummary;
    private String reason;
    private String evidence;
    private List<String> riskFactors;
    private List<String> positiveFactors;
    private List<String> negativeFactors;
    private String suggestedAction;

    // Getters and Setters
    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public Integer getCreditScore() { return creditScore; }
    public void setCreditScore(Integer creditScore) { this.creditScore = creditScore; }

    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }

    public Double getTotalPurchases() { return totalPurchases; }
    public void setTotalPurchases(Double totalPurchases) { this.totalPurchases = totalPurchases; }

    public Integer getPurchaseFrequency() { return purchaseFrequency; }
    public void setPurchaseFrequency(Integer purchaseFrequency) { this.purchaseFrequency = purchaseFrequency; }

    public Integer getCompletedOrders() { return completedOrders; }
    public void setCompletedOrders(Integer completedOrders) { this.completedOrders = completedOrders; }

    public Integer getCancelledOrders() { return cancelledOrders; }
    public void setCancelledOrders(Integer cancelledOrders) { this.cancelledOrders = cancelledOrders; }

    public Double getAverageInvoiceValue() { return averageInvoiceValue; }
    public void setAverageInvoiceValue(Double averageInvoiceValue) { this.averageInvoiceValue = averageInvoiceValue; }

    public Double getOutstandingBalance() { return outstandingBalance; }
    public void setOutstandingBalance(Double outstandingBalance) { this.outstandingBalance = outstandingBalance; }

    public Integer getOverduePayments() { return overduePayments; }
    public void setOverduePayments(Integer overduePayments) { this.overduePayments = overduePayments; }

    public Integer getAveragePaymentDelay() { return averagePaymentDelay; }
    public void setAveragePaymentDelay(Integer averagePaymentDelay) { this.averagePaymentDelay = averagePaymentDelay; }

    public Double getCreditLimit() { return creditLimit; }
    public void setCreditLimit(Double creditLimit) { this.creditLimit = creditLimit; }

    public Double getAvailableCredit() { return availableCredit; }
    public void setAvailableCredit(Double availableCredit) { this.availableCredit = availableCredit; }

    public String getAiRecommendation() { return aiRecommendation; }
    public void setAiRecommendation(String aiRecommendation) { this.aiRecommendation = aiRecommendation; }

    public String getPaymentBehaviourSummary() { return paymentBehaviourSummary; }
    public void setPaymentBehaviourSummary(String paymentBehaviourSummary) { this.paymentBehaviourSummary = paymentBehaviourSummary; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getEvidence() { return evidence; }
    public void setEvidence(String evidence) { this.evidence = evidence; }

    public List<String> getRiskFactors() { return riskFactors; }
    public void setRiskFactors(List<String> riskFactors) { this.riskFactors = riskFactors; }

    public List<String> getPositiveFactors() { return positiveFactors; }
    public void setPositiveFactors(List<String> positiveFactors) { this.positiveFactors = positiveFactors; }

    public List<String> getNegativeFactors() { return negativeFactors; }
    public void setNegativeFactors(List<String> negativeFactors) { this.negativeFactors = negativeFactors; }

    public String getSuggestedAction() { return suggestedAction; }
    public void setSuggestedAction(String suggestedAction) { this.suggestedAction = suggestedAction; }
}
