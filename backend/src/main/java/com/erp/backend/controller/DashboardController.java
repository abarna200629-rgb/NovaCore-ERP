package com.erp.backend.controller;

import java.util.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.erp.backend.dto.DashboardResponse;
import com.erp.backend.service.DashboardService;
import com.erp.backend.service.AIBusinessAssistantService;

@RestController
@CrossOrigin("*")
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    @Autowired
    private AIBusinessAssistantService aiBusinessAssistantService;

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/api/dashboard")
    public DashboardResponse dashboard(Authentication auth) {
        System.out.println("USERNAME = " + auth.getName());
        System.out.println("ROLE = " + auth.getAuthorities().iterator().next().getAuthority());
        return dashboardService.getDashboard();
    }

    // AI CHAT
    @PreAuthorize("isAuthenticated()")
    @PostMapping("/api/ai/chat")
    public Map<String, Object> aiChat(@RequestBody Map<String, String> body, Authentication auth) {
        String roleName = auth.getAuthorities().iterator().next().getAuthority();
        return aiBusinessAssistantService.getDecisionChatResponse(body.get("message"), roleName, auth.getName());
    }

    // AI SUMMARY
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    @GetMapping("/api/ai/summary")
    public Map<String, Object> aiSummary() {
        return dashboardService.getAIBusinessSummary();
    }

    // AI REPORT SUMMARY INDIVIDUAL
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN', 'HR', 'ROLE_HR', 'FINANCE', 'ROLE_FINANCE', 'SALES', 'ROLE_SALES', 'INVENTORY', 'ROLE_INVENTORY')")
    @PostMapping("/api/ai/report-summary")
    public Map<String, Object> aiReportSummary(@RequestBody Map<String, String> body) {
        return dashboardService.getAIReportSummary(body.get("reportName"));
    }

    // AI RECOMMENDATIONS
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    @GetMapping("/api/ai/recommendations")
    public List<String> aiRecommendations() {
        return dashboardService.getAIRecommendations();
    }

    // BUSINESS HEALTH SCORE
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN', 'FINANCE', 'ROLE_FINANCE')")
    @GetMapping("/api/ai/health-score")
    public Map<String, Object> aiHealthScore() {
        return dashboardService.getBusinessHealthScore();
    }

    // AI RISK ANALYZER
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/api/ai/risks")
    public List<Map<String, Object>> aiRisks() {
        return dashboardService.getAIRisks();
    }

    // WHAT-IF SIMULATOR
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN', 'FINANCE', 'ROLE_FINANCE')")
    @GetMapping("/api/ai/simulate")
    public Map<String, Object> aiSimulate(
            @RequestParam double priceChangePct,
            @RequestParam double expenseChangePct,
            @RequestParam double workforceChangePct) {
        return dashboardService.getBusinessSimulation(priceChangePct, expenseChangePct, workforceChangePct);
    }

    // AI FORECASTS
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN', 'FINANCE', 'ROLE_FINANCE', 'SALES', 'ROLE_SALES')")
    @GetMapping("/api/ai/forecasts/sales")
    public Map<String, Object> salesForecast() {
        return dashboardService.getSalesForecast();
    }

    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN', 'INVENTORY', 'ROLE_INVENTORY')")
    @GetMapping("/api/ai/forecasts/inventory")
    public List<Map<String, Object>> inventoryForecast() {
        return dashboardService.getInventoryForecast();
    }

    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN', 'HR', 'ROLE_HR')")
    @GetMapping("/api/ai/forecasts/attendance")
    public Map<String, Object> attendanceForecast() {
        return dashboardService.getAttendanceForecast();
    }

    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN', 'FINANCE', 'ROLE_FINANCE')")
    @GetMapping("/api/ai/forecasts/expenses")
    public Map<String, Object> expenseForecast() {
        return dashboardService.getExpenseForecast();
    }

    // SMART ALERTS
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/api/ai/alerts")
    public List<String> smartAlerts() {
        return dashboardService.getSmartAlerts();
    }

    // AUTO DAILY REPORT TEXT
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    @GetMapping("/api/ai/daily-report")
    public Map<String, String> dailyReport() {
        Map<String, String> res = new HashMap<>();
        res.put("report", dashboardService.getDailyReportText());
        return res;
    }

    // EMAIL REPORT
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    @PostMapping("/api/ai/email-report")
    public Map<String, Object> emailReport(@RequestBody Map<String, String> body) {
        boolean sent = dashboardService.emailDailyReport(body.get("email"));
        Map<String, Object> res = new HashMap<>();
        res.put("success", sent);
        res.put("message", sent ? "Report successfully emailed." : "Failed to email report.");
        return res;
    }

    // AI MEETING GENERATOR
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    @GetMapping("/api/ai/meeting-agenda")
    public Map<String, Object> meetingAgenda() {
        return dashboardService.getMeetingAgenda();
    }

    // AI FRAUD DETECTION
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN', 'FINANCE', 'ROLE_FINANCE')")
    @GetMapping("/api/ai/fraud")
    public List<Map<String, Object>> aiFraud() {
        return dashboardService.getAIFraudAlerts();
    }

    // CARBON FOOTPRINT ANALYTICS
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN', 'INVENTORY', 'ROLE_INVENTORY')")
    @GetMapping("/api/ai/carbon-footprint")
    public Map<String, Object> carbonFootprint() {
        return dashboardService.getCarbonFootprint();
    }

    // PREDICTIVE MAINTENANCE
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN', 'INVENTORY', 'ROLE_INVENTORY')")
    @GetMapping("/api/ai/predictive-maintenance")
    public List<Map<String, Object>> predictiveMaintenance() {
        return dashboardService.getPredictiveMaintenance();
    }

    // EMERGENCY PURCHASE AUTOMATION
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN', 'INVENTORY', 'ROLE_INVENTORY')")
    @PostMapping("/api/ai/emergency-purchase")
    public List<Map<String, Object>> emergencyPurchase() {
        return dashboardService.executeEmergencyPurchases();
    }

    // DEPARTMENT LEADERBOARD (GAMIFICATION)
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/api/ai/leaderboard")
    public List<Map<String, Object>> leaderboard() {
        return dashboardService.getDepartmentLeaderboard();
    }
}