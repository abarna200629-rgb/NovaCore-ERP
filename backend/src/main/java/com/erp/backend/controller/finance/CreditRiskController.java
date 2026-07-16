package com.erp.backend.controller.finance;

import java.util.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.erp.backend.dto.finance.CreditScoreDTO;
import com.erp.backend.entity.sales.Customer;
import com.erp.backend.repository.sales.CustomerRepository;
import com.erp.backend.service.finance.CreditRiskService;

@RestController
@RequestMapping("/api/finance/credit-risk")
@CrossOrigin("*")
@PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN', 'FINANCE', 'ROLE_FINANCE', 'SALES', 'ROLE_SALES')")
public class CreditRiskController {

    @Autowired
    private CreditRiskService creditRiskService;

    @Autowired
    private CustomerRepository customerRepository;

    @GetMapping
    public Map<String, Object> getCreditRiskDashboard() {
        List<CreditScoreDTO> list = creditRiskService.getAllAssessments();

        int total = list.size();
        int low = 0;
        int medium = 0;
        int high = 0;
        int critical = 0;
        double sumScore = 0.0;
        String highestRiskCust = "N/A";
        int lowestScore = 1001;

        for (CreditScoreDTO dto : list) {
            sumScore += dto.getCreditScore();
            String rl = dto.getRiskLevel();
            if ("LOW RISK".equals(rl)) low++;
            else if ("MEDIUM RISK".equals(rl)) medium++;
            else if ("HIGH RISK".equals(rl)) high++;
            else if ("CRITICAL RISK".equals(rl)) critical++;

            if (dto.getCreditScore() < lowestScore) {
                lowestScore = dto.getCreditScore();
                highestRiskCust = dto.getCustomerName() + " (" + dto.getCreditScore() + " pts)";
            }
        }

        double averageScore = total > 0 ? (sumScore / total) : 0.0;

        List<CreditScoreDTO> sorted = new ArrayList<>(list);
        
        // Top Trusted (Safe)
        sorted.sort((a, b) -> b.getCreditScore().compareTo(a.getCreditScore()));
        List<CreditScoreDTO> topSafe = sorted.stream().limit(10).toList();

        // Top Risk
        List<CreditScoreDTO> sortedRisk = new ArrayList<>(list);
        sortedRisk.sort((a, b) -> a.getCreditScore().compareTo(b.getCreditScore()));
        List<CreditScoreDTO> topRisk = sortedRisk.stream().limit(10).toList();

        // Mock Monthly credit trend
        List<Map<String, Object>> monthlyTrend = new ArrayList<>();
        monthlyTrend.add(Map.of("month", "May", "score", Math.max(0.0, averageScore - 15)));
        monthlyTrend.add(Map.of("month", "June", "score", Math.max(0.0, averageScore - 5)));
        monthlyTrend.add(Map.of("month", "July", "score", averageScore));

        // Mock Outstanding trend
        double sumOutstanding = list.stream().mapToDouble(CreditScoreDTO::getOutstandingBalance).sum();
        List<Map<String, Object>> outstandingTrend = new ArrayList<>();
        outstandingTrend.add(Map.of("month", "May", "amount", sumOutstanding * 0.9));
        outstandingTrend.add(Map.of("month", "June", "amount", sumOutstanding * 0.85));
        outstandingTrend.add(Map.of("month", "July", "amount", sumOutstanding));

        Map<String, Object> response = new HashMap<>();
        response.put("totalCustomers", total);
        response.put("lowRiskCount", low);
        response.put("mediumRiskCount", medium);
        response.put("highRiskCount", high);
        response.put("criticalRiskCount", critical);
        response.put("averageCreditScore", Math.round(averageScore * 10.0) / 10.0);
        response.put("highestRiskCustomer", highestRiskCust);
        response.put("top10Risk", topRisk);
        response.put("top10Safe", topSafe);
        response.put("monthlyCreditTrend", monthlyTrend);
        response.put("outstandingAmountTrend", outstandingTrend);
        response.put("allCustomers", list);

        return response;
    }

    @GetMapping("/{customerId}")
    public CreditScoreDTO getCustomerCreditRisk(@PathVariable Long customerId) {
        Customer cust = customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found with ID: " + customerId));
        return creditRiskService.analyzeCustomer(cust);
    }

    @GetMapping("/top-risk")
    public List<CreditScoreDTO> getTopRiskCustomers() {
        List<CreditScoreDTO> list = creditRiskService.getAllAssessments();
        List<CreditScoreDTO> sorted = new ArrayList<>(list);
        sorted.sort((a, b) -> a.getCreditScore().compareTo(b.getCreditScore()));
        return sorted.stream().limit(10).toList();
    }

    @GetMapping("/top-safe")
    public List<CreditScoreDTO> getTopSafeCustomers() {
        List<CreditScoreDTO> list = creditRiskService.getAllAssessments();
        List<CreditScoreDTO> sorted = new ArrayList<>(list);
        sorted.sort((a, b) -> b.getCreditScore().compareTo(a.getCreditScore()));
        return sorted.stream().limit(10).toList();
    }
}
