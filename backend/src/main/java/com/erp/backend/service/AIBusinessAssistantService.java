package com.erp.backend.service;

import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.erp.backend.entity.*;
import com.erp.backend.entity.finance.*;
import com.erp.backend.entity.sales.*;
import com.erp.backend.entity.hr.*;
import com.erp.backend.entity.inventory.*;
import com.erp.backend.repository.*;
import com.erp.backend.repository.finance.*;
import com.erp.backend.repository.sales.*;
import com.erp.backend.repository.hr.*;
import com.erp.backend.repository.inventory.*;
import com.erp.backend.repository.production.*;
import com.erp.backend.repository.task.TaskRepository;
import com.erp.backend.repository.performance.EmployeePerformanceRepository;

@Service
public class AIBusinessAssistantService {

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private ProductionRepository productionRepository;

    @Autowired
    private SalesOrderRepository salesOrderRepository;

    @Autowired
    private IncomeRepository incomeRepository;

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private LeaveRepository leaveRepository;

    @Autowired
    private SalesTargetRepository salesTargetRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private EmployeePerformanceRepository performanceRepository;

    @Autowired
    private PayrollRepository payrollRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private PurchaseRequestRepository purchaseRequestRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private DashboardService dashboardService;

    // Per-user conversation memory context structure
    public static class UserChatContext {
        public String lastIntent;
        public String lastQuery;
        public Double lastValue;
        public Map<String, Object> lastDetails;

        public UserChatContext() {
            this.lastIntent = "NONE";
            this.lastQuery = "";
            this.lastDetails = new HashMap<>();
        }
    }

    private final Map<String, UserChatContext> userSessionContext = new ConcurrentHashMap<>();

    private UserChatContext getOrCreateContext(String username) {
        return userSessionContext.computeIfAbsent(username, k -> new UserChatContext());
    }

    // Levenshtein distance calculator for fuzzy matching
    private int getLevenshteinDistance(String s1, String s2) {
        int[] costs = new int[s2.length() + 1];
        for (int i = 0; i <= s1.length(); i++) {
            int lastValue = i;
            for (int j = 0; j <= s2.length(); j++) {
                if (i == 0) {
                    costs[j] = j;
                } else {
                    if (j > 0) {
                        int newValue = costs[j - 1];
                        if (s1.charAt(i - 1) != s2.charAt(j - 1)) {
                            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                        }
                        costs[j - 1] = lastValue;
                        lastValue = newValue;
                    }
                }
            }
            if (i > 0) {
                costs[s2.length()] = lastValue;
            }
        }
        return costs[s2.length()];
    }

    private boolean isFuzzyMatch(String w1, String w2) {
        if (w1.equals(w2)) return true;
        int len1 = w1.length();
        int len2 = w2.length();
        if (Math.abs(len1 - len2) > 2) return false;
        
        int distance = getLevenshteinDistance(w1, w2);
        if (len1 <= 4 || len2 <= 4) {
            return distance <= 1; // max 1 typo for short words
        }
        return distance <= 2; // max 2 typos for longer words
    }

    // Stemmer / Lemmatizer to standardize plurals and tenses
    private String stem(String word) {
        if (word == null || word.length() <= 2) return word;
        
        if (word.endsWith("ing")) {
            word = word.substring(0, word.length() - 3);
        } else if (word.endsWith("ed")) {
            word = word.substring(0, word.length() - 2);
        } else if (word.endsWith("ies")) {
            word = word.substring(0, word.length() - 3) + "y";
        } else if (word.endsWith("es")) {
            word = word.substring(0, word.length() - 2);
        } else if (word.endsWith("s") && !word.endsWith("ss")) {
            word = word.substring(0, word.length() - 1);
        }
        
        if (word.equals("revenue") || word.equals("revenues") || word.equals("rev")) return "revenue";
        if (word.equals("expense") || word.equals("expenses") || word.equals("expenditure") || word.equals("expenditures") || word.equals("cost") || word.equals("costs") || word.equals("outflow") || word.equals("outflows") || word.equals("spend") || word.equals("spending")) return "expense";
        if (word.equals("profit") || word.equals("profits") || word.equals("margin") || word.equals("margins") || word.equals("gain") || word.equals("gains") || word.equals("net")) return "profit";
        if (word.equals("sale") || word.equals("sales") || word.equals("sell") || word.equals("selling") || word.equals("sold") || word.equals("billing") || word.equals("bill") || word.equals("bills") || word.equals("invoice") || word.equals("invoices") || word.equals("order") || word.equals("orders")) return "sales";
        if (word.equals("attendance") || word.equals("attend") || word.equals("present") || word.equals("absent") || word.equals("absence") || word.equals("absences") || word.equals("checkin") || word.equals("checkout") || word.equals("checked") || word.equals("work") || word.equals("working") || word.equals("office") || word.equals("came") || word.equals("showed") || word.equals("login") || word.equals("logout")) return "attendance";
        if (word.equals("leave") || word.equals("leaves") || word.equals("vacation") || word.equals("vacations") || word.equals("holiday") || word.equals("holidays") || word.equals("timeoff") || word.equals("off")) return "leave";
        if (word.equals("stock") || word.equals("stocks") || word.equals("inventory") || word.equals("inventories") || word.equals("product") || word.equals("products") || word.equals("item") || word.equals("items") || word.equals("catalog")) return "inventory";
        if (word.equals("supplier") || word.equals("suppliers") || word.equals("vendor") || word.equals("vendors") || word.equals("merchant") || word.equals("merchants")) return "supplier";
        if (word.equals("customer") || word.equals("customers") || word.equals("client") || word.equals("clients") || word.equals("buyer") || word.equals("buyers")) return "customer";
        if (word.equals("employee") || word.equals("employees") || word.equals("staff") || word.equals("workforce") || word.equals("worker") || word.equals("workers") || word.equals("member") || word.equals("members")) return "employee";
        if (word.equals("payroll") || word.equals("payrolls") || word.equals("salary") || word.equals("salaries") || word.equals("wage") || word.equals("wages") || word.equals("compensation") || word.equals("payout") || word.equals("payouts")) return "payroll";
        if (word.equals("report") || word.equals("reports") || word.equals("reporting") || word.equals("summary") || word.equals("summaries") || word.equals("analytics") || word.equals("briefing") || word.equals("overview")) return "report";
        if (word.equals("audit") || word.equals("audits") || word.equals("log") || word.equals("logs") || word.equals("history") || word.equals("activity") || word.equals("activities") || word.equals("track") || word.equals("tracking") || word.equals("event") || word.equals("events")) return "audit";
        if (word.equals("forecast") || word.equals("forecasts") || word.equals("predict") || word.equals("predicts") || word.equals("prediction") || word.equals("predictions") || word.equals("predictive") || word.equals("future") || word.equals("tomorrow")) return "forecast";
        
        return word;
    }

    public Map<String, Object> getDecisionChatResponse(String message, String role, String username) {
        String msg = message.toLowerCase();
        String normalizedRole = (role != null) ? role.toUpperCase().replace("ROLE_", "") : "EMPLOYEE";

        // Query logged in profile
        com.erp.backend.entity.Employee currentEmp = employeeRepository.findAll().stream()
                .filter(e -> username.equalsIgnoreCase(e.getGeneratedUsername()) || username.equalsIgnoreCase(e.getEmail()))
                .findFirst()
                .orElse(null);

        String today = LocalDate.now().toString();
        String reply = "";

        // 1. Text Normalization & Tokenization
        String cleanMsg = msg.replaceAll("[^a-z0-9\\s]", " ");
        String[] rawTokens = cleanMsg.split("\\s+");
        List<String> stopWords = Arrays.asList(
            "the", "is", "are", "please", "can", "could", "tell", "show", "what", "who", "today's", "today",
            "how", "me", "any", "which", "with", "we", "do", "have", "has", "query", "run", "display", "list",
            "get", "view", "status", "alert", "alerts", "a", "an", "of", "to", "for", "in", "on", "or", "and",
            "at", "by", "from", "should", "would", "about"
        );
        List<String> tokens = Arrays.stream(rawTokens)
                .map(String::trim)
                .filter(t -> !t.isEmpty())
                .filter(t -> !stopWords.contains(t))
                .collect(Collectors.toList());

        // 2. Expand Synonym Intent Mapping (at least 30 variations each)
        Map<String, List<String>> synonyms = new HashMap<>();

        synonyms.put("BUSINESS_SUMMARY", Arrays.asList(
            "summary", "briefing", "overview", "dashboard", "health", "morning", "business", "company", "brief", 
            "briefings", "overviews", "summaries", "morning briefing", "morning brief", "business summary", 
            "company summary", "company overview", "dashboard summary", "status", "status update", "updates", 
            "morning update", "daily status", "daily update", "morning overview", "quick brief", "quick summary", 
            "executive summary", "business kpis", "kpi summary", "operation summary", "morning status"
        ));

        synonyms.put("ROOT_CAUSE", Arrays.asList(
            "why", "decrease", "low", "increase", "drop", "dropped", "reduced", "rose", "high", "cause", "reason", 
            "reasons", "anomaly", "anomalies", "declined", "decline", "plummet", "plummeted", "spike", "spiked", 
            "inflated", "growing", "shrinking", "why low", "why high", "why dropped", "root cause", "explanations", 
            "explain", "explaining", "why decrease", "low margins", "high expenses"
        ));

        synonyms.put("BUSINESS_RISKS", Arrays.asList(
            "risk", "risks", "threat", "threats", "danger", "dangers", "warning", "warnings", "exposure", "exposures", 
            "hazard", "hazards", "vulnerability", "vulnerabilities", "critical issues", "issues", "alert", "alerts", 
            "financial risk", "hr risk", "inventory risk", "sales risk", "business risk", "weakness", "weaknesses", 
            "pitfall", "pitfalls", "jeopardy", "imperil", "critical alerts", "operational risk"
        ));

        synonyms.put("SMART_RECOMMENDATIONS", Arrays.asList(
            "recommend", "recommendation", "recommendations", "suggest", "suggestion", "suggestions", "advice", "advise", 
            "advising", "recommend actions", "action steps", "solutions", "solution", "what to do", "next steps", 
            "remedy", "remedies", "optimization", "optimize", "improvement", "improvements", "guidance", "guide", 
            "actionable", "corrective", "corrective actions", "action plan", "business advice", "smart suggestions", 
            "ai advice"
        ));

        synonyms.put("EMPLOYEE_INSIGHTS", Arrays.asList(
            "promotion", "promotions", "attention", "absence", "absences", "best", "worst", "employee", "employees", 
            "staff", "headcount", "workforce", "worker", "workers", "member", "members", "personnel", "personnels", 
            "hr directory", "employee directory", "staff list", "worker directory", "roster", "talent", "team", 
            "teams", "promotion ready", "hr warning", "hr warnings", "absenteeism", "top performer", "best employee"
        ));

        synonyms.put("INVENTORY_INTELLIGENCE", Arrays.asList(
            "reorder", "moving", "fastest", "dead", "valuation", "stock", "inventory", "depletion", "valuations", 
            "inventories", "stocks", "products", "product", "items", "item", "catalog", "catalogs", "catalogues", 
            "skus", "sku", "stock counts", "inventory level", "inventory levels", "stock level", "stock levels", 
            "fastest moving", "dead stock", "stock valuation", "replenishing", "safety stock"
        ));

        synonyms.put("FINANCE_INTELLIGENCE", Arrays.asList(
            "cash", "flow", "budget", "trend", "trends", "financial", "revenue", "profit", "expense", "expenses", 
            "revenues", "profits", "margin", "margins", "income", "inflow", "inflows", "outflow", "outflows", 
            "earnings", "turnover", "net profit", "payouts", "payout", "cost", "costs", "expenditure", 
            "expenditures", "cashflow", "finance info", "net returns"
        ));

        synonyms.put("SALES_INTELLIGENCE", Arrays.asList(
            "top", "selling", "customer", "customers", "client", "clients", "unsold", "target", "achievement", 
            "salesperson", "sales", "buyer", "buyers", "sales order", "sales orders", "sales targets", "top client", 
            "sales numbers", "order count", "order volume", "corporate sales", "sales aggregates", "deal", "deals", 
            "best client", "top seller", "fast seller", "top buyer", "biggest customer"
        ));

        synonyms.put("SUPPLIER_INTELLIGENCE", Arrays.asList(
            "supplier", "suppliers", "vendor", "vendors", "delivery", "performance", "leadtime", "distributor", 
            "distributors", "wholesaler", "wholesalers", "provider", "providers", "merchant", "merchants", 
            "supplier performance", "supplier ratings", "supplier rating", "best supplier", "worst supplier", 
            "lead times", "delivery logs", "supply partner", "supply partners", "purchase orders", "purchase order", 
            "procurement", "supply source"
        ));

        synonyms.put("PREDICTIVE_INSIGHTS", Arrays.asList(
            "forecast", "forecasts", "predictive", "predict", "tomorrow", "expected", "future", "projections", 
            "projection", "expecting", "linear regression", "expected tomorrow", "prediction log", "forecast analysis", 
            "sales forecast", "attendance forecast", "expense forecast", "inventory forecast", "future trends", 
            "expected trends", "expect tomorrow", "attendance tomorrow", "sales tomorrow"
        ));

        synonyms.put("REPORTS", Arrays.asList(
            "report", "reports", "generate", "analytics", "sheet", "sheets", "ledger", "ledgers", "profit report", 
            "sales report", "inventory report", "generating report", "view report", "monthly report", "weekly report", 
            "financial sheet", "general ledger", "reporting logs", "report summaries", "sheet analytics", 
            "performance report", "attendance report", "leaves report"
        ));

        synonyms.put("AUDIT_LOGS", Arrays.asList(
            "audit", "logs", "history", "actions", "activities", "activity", "log", "tracks", "tracking", "event", 
            "events", "user actions", "system logs", "audit log", "audit logs", "audit history", "recent logs", 
            "recent actions", "admin logs", "activity history", "audit tracks", "logged activities", 
            "logged actions", "security logs", "admin audit", "history list"
        ));

        synonyms.put("ATTENDANCE", Arrays.asList(
            "attendance", "attend", "checked", "checkin", "checkout", "working", "present", "absent", "absence", 
            "absences", "office", "came", "came today", "logged", "login", "logout", "here", "missing", "late", 
            "tardy", "in office", "worked", "staff here", "who is here", "who checked in", "daily attendance", 
            "presence", "attendance list", "check ins", "check-in", "check-out", "roll call", "roster", "who is working"
        ));

        synonyms.put("LEAVE", Arrays.asList(
            "leave", "leaves", "vacation", "vacations", "holiday", "holidays", "timeoff", "time off", "off", "sick", 
            "casual leave", "medical leave", "earned leave", "request", "requested", "requested leave", "applied", 
            "applied leave", "who is off", "out of office", "ooo", "not working", "absence request", "leave request", 
            "leave requests", "permissions", "permits", "unpaid leave", "paid leave", "maternity", "paternity", 
            "break", "vacation request"
        ));

        UserChatContext context = getOrCreateContext(username);

        // Detect follow-up questions
        boolean isFollowUpWhy = tokens.contains("why") || msg.equals("why") || msg.contains("explain why") || msg.contains("why is that");
        boolean isFollowUpWho = tokens.contains("who") || tokens.contains("customer") || tokens.contains("employee") || msg.contains("which customer") || msg.contains("contributed most") || msg.contains("best salesperson");

        String winningIntent = "NONE";
        double highestScore = 0.0;

        // 1. Strict Override rule: If any attendance-related words are detected, classify as ATTENDANCE
        boolean hasAttendanceWord = tokens.stream().anyMatch(t -> {
            String s = stem(t);
            return s.equals("attendance") || s.equals("attend") || s.equals("present") || s.equals("absent") || s.equals("checkin") || s.equals("checkout");
        });

        // 2. Perform confidence similarity scoring first to find best topic match
        String topicIntent = "NONE";
        for (Map.Entry<String, List<String>> entry : synonyms.entrySet()) {
            String intent = entry.getKey();
            List<String> synonymList = entry.getValue();
            double score = 0.0;

            for (String token : tokens) {
                String stemmedToken = stem(token);
                for (String synonym : synonymList) {
                    String[] synTokens = synonym.split("\\s+");
                    for (String synToken : synTokens) {
                        String stemmedSyn = stem(synToken);
                        
                        if (stemmedToken.equals(stemmedSyn)) {
                            score += 1.0;
                        } else if (isFuzzyMatch(stemmedToken, stemmedSyn)) {
                            score += 0.7; // slightly lower weight for fuzzy match
                        } else if (stemmedSyn.contains(stemmedToken) && stemmedToken.length() >= 4) {
                            score += 0.5; // partial substring matching weight
                        }
                    }
                }
            }

            if (score > highestScore) {
                highestScore = score;
                topicIntent = intent;
            }
        }

        // 3. Resolve winning intent based on priority
        if (hasAttendanceWord) {
            winningIntent = "ATTENDANCE";
            highestScore = 1.0;
        } else if (highestScore >= 1.0) {
            // High confidence topic match overrides any follow-up guess
            winningIntent = topicIntent;
        } else {
            // Check follow-up signals if score is low or zero
            if (isFollowUpWhy && !"NONE".equals(context.lastIntent)) {
                winningIntent = "ROOT_CAUSE";
            } else if (isFollowUpWho && !"NONE".equals(context.lastIntent)) {
                winningIntent = "FOLLOW_UP_DETAILS";
            } else if (highestScore > 0.0) {
                // Fallback to low confidence topic if no follow-up is matched
                winningIntent = topicIntent;
            }
        }

        // Centralized Chatbot permission check:
        if (!"ADMIN".equalsIgnoreCase(normalizedRole)) {
            if ("INVENTORY".equalsIgnoreCase(normalizedRole)) {
                if (!"INVENTORY_INTELLIGENCE".equalsIgnoreCase(winningIntent) && !"SUPPLIER_INTELLIGENCE".equalsIgnoreCase(winningIntent)) {
                    reply = "Access Denied: As an Inventory user, you can only ask questions related to Inventory, Products, and Suppliers.";
                    winningIntent = "ACCESS_DENIED";
                }
            } else if ("SALES".equalsIgnoreCase(normalizedRole)) {
                if (!"SALES_INTELLIGENCE".equalsIgnoreCase(winningIntent)) {
                    reply = "Access Denied: As a Sales user, you can only ask questions related to Sales, Customers, Orders, and CRM.";
                    winningIntent = "ACCESS_DENIED";
                }
            } else if ("FINANCE".equalsIgnoreCase(normalizedRole)) {
                if ("EMPLOYEE_INSIGHTS".equalsIgnoreCase(winningIntent) || "ATTENDANCE".equalsIgnoreCase(winningIntent) || "LEAVE".equalsIgnoreCase(winningIntent) || "PAYROLL".equalsIgnoreCase(winningIntent) || msg.contains("payroll") || msg.contains("salary") || msg.contains("wage")) {
                    reply = "Access Denied: Finance role does not have access to payroll salary details.";
                    winningIntent = "ACCESS_DENIED";
                } else if ("INVENTORY_INTELLIGENCE".equalsIgnoreCase(winningIntent) || "SUPPLIER_INTELLIGENCE".equalsIgnoreCase(winningIntent)) {
                    reply = "Access Denied: Finance role does not have access to inventory or supplier metrics.";
                    winningIntent = "ACCESS_DENIED";
                }
            } else if ("HR".equalsIgnoreCase(normalizedRole)) {
                if ("INVENTORY_INTELLIGENCE".equalsIgnoreCase(winningIntent) || "SUPPLIER_INTELLIGENCE".equalsIgnoreCase(winningIntent) || "SALES_INTELLIGENCE".equalsIgnoreCase(winningIntent)) {
                    reply = "Access Denied: HR role does not have access to inventory, sales, or supplier metrics.";
                    winningIntent = "ACCESS_DENIED";
                }
            } else if ("EMPLOYEE".equalsIgnoreCase(normalizedRole)) {
                if (!"ATTENDANCE".equalsIgnoreCase(winningIntent) && !"LEAVE".equalsIgnoreCase(winningIntent)) {
                    reply = "Access Denied: As an Employee, you can only ask about your own attendance, leaves, payroll, profile, and tasks.";
                    winningIntent = "ACCESS_DENIED";
                }
            }
        }

        String accessDeniedMsg = "Access Denied\n\nYour current role does not have permission to access this information.\n\nPlease contact your administrator if additional access is required.";

        // 3. Intent Processing Logic
        if ("ACCESS_DENIED".equalsIgnoreCase(winningIntent)) {
            // Already populated
        } else if ("NONE".equals(winningIntent) || (highestScore == 0.0 && !isFollowUpWhy && !isFollowUpWho)) {
            reply = "I couldn't fully understand your request. Did you mean Attendance, Leave, Sales, Inventory, Payroll, or Reports?";
        } else if ("BUSINESS_SUMMARY".equalsIgnoreCase(winningIntent)) {
            if (!"ADMIN".equalsIgnoreCase(normalizedRole)) {
                reply = accessDeniedMsg;
            } else {
                Double revenue = incomeRepository.findAll().stream().mapToDouble(i -> i.getAmount() != null ? i.getAmount() : 0.0).sum();
                Double expenses = expenseRepository.findAll().stream().mapToDouble(e -> e.getAmount() != null ? e.getAmount() : 0.0).sum();
                Double profit = revenue - expenses;
                long ordersCount = salesOrderRepository.count();
                List<Attendance> todayAtt = attendanceRepository.findByDate(today);
                long presentCount = todayAtt.stream().filter(a -> "PRESENT".equalsIgnoreCase(a.getStatus()) || "LATE".equalsIgnoreCase(a.getStatus()) || "HALF DAY".equalsIgnoreCase(a.getStatus())).count();
                long pendingLeaves = leaveRepository.countByStatus("PENDING");
                long pendingPurchases = purchaseRequestRepository.findAll().stream().filter(pr -> "PENDING".equalsIgnoreCase(pr.getStatus())).count();
                long lowStockCount = productRepository.countByQuantityLessThan(10);

                reply = "### 📊 morning briefing: Enterprise Business Summary\n" +
                        "* **Total Revenue:** ₹" + String.format("%,.2f", revenue) + "\n" +
                        "* **Total Expenses:** ₹" + String.format("%,.2f", expenses) + "\n" +
                        "* **Net Profit:** ₹" + String.format("%,.2f", profit) + "\n" +
                        "* **Order Volume:** " + ordersCount + " sales orders\n" +
                        "* **Workforce Attendance:** " + presentCount + " staff checked in\n" +
                        "* **Pending Leaves:** " + pendingLeaves + " requests awaiting HR review\n" +
                        "* **Pending Purchase Orders:** " + pendingPurchases + " requests awaiting approval\n" +
                        "* **Low Stock Alerts:** " + lowStockCount + " products below safety limit\n\n" +
                        "**AI Recommendations**\n" +
                        (lowStockCount > 0 ? "* restock " + lowStockCount + " items below safety limits.\n" : "") +
                        (pendingLeaves > 0 ? "* approve HR leave requests to adjust scheduling.\n" : "") +
                        (profit < 0 ? "* budget deficit warning: reduce discretionary expenses.\n" : "* positive cash flows maintained.");
                
                context.lastIntent = "BUSINESS_SUMMARY";
            }
        } else if ("ROOT_CAUSE".equalsIgnoreCase(winningIntent)) {
            String priorIntent = context.lastIntent;
            if ("NONE".equals(priorIntent)) {
                reply = "Please specify what metric you'd like to analyze: Sales, Profit, Expenses, or Inventory?";
            } else if ("FINANCE_INTELLIGENCE".equalsIgnoreCase(priorIntent) || "SALES_INTELLIGENCE".equalsIgnoreCase(priorIntent) || "BUSINESS_SUMMARY".equalsIgnoreCase(priorIntent) || "ATTENDANCE".equalsIgnoreCase(priorIntent)) {
                if (!"ADMIN".equalsIgnoreCase(normalizedRole) && !"FINANCE".equalsIgnoreCase(normalizedRole) && !"SALES".equalsIgnoreCase(normalizedRole)) {
                    reply = accessDeniedMsg;
                } else {
                    List<Product> lowSellers = productRepository.findAll().stream()
                            .filter(p -> p.getQuantity() != null && p.getQuantity() <= (p.getMinStockLevel() != null ? p.getMinStockLevel() : 10))
                            .limit(3).collect(Collectors.toList());
                    String lowSellersString = lowSellers.stream().map(Product::getProductName).collect(Collectors.joining(", "));
                    reply = "### 🔍 AI Root Cause: Revenue/Sales Analysis\n" +
                            "**Observations:**\n" +
                            "* Product inventory constraints: " + (lowSellers.isEmpty() ? "No products out of stock." : "Products [" + lowSellersString + "] are below reorder thresholds, choking potential order fulfillment.") + "\n" +
                            "* Purchase request overhead: Expense records indicate procurement overhead increases.\n\n" +
                            "**Recommendations:**\n" +
                            "* restock products below minimum limits.\n" +
                            "* audit largest supply categories to control outflows.";
                }
            } else if ("INVENTORY_INTELLIGENCE".equalsIgnoreCase(priorIntent)) {
                if (!"ADMIN".equalsIgnoreCase(normalizedRole) && !"INVENTORY".equalsIgnoreCase(normalizedRole)) {
                    reply = accessDeniedMsg;
                } else {
                    long lowStock = productRepository.countByQuantityLessThan(10);
                    reply = "### 🔍 AI Root Cause: Inventory Depletion\n" +
                            "**Observations:**\n" +
                            "* " + lowStock + " items have fallen below safety limits due to high order volume and delayed purchase approvals.\n\n" +
                            "**Recommendations:**\n" +
                            "* approve outstanding purchase requests.\n" +
                            "* restock safety levels with high-rating suppliers.";
                }
            } else {
                reply = "Current context holds no anomalies. All metrics are operating within thresholds.";
            }
        } else if ("BUSINESS_RISKS".equalsIgnoreCase(winningIntent)) {
            if (!"ADMIN".equalsIgnoreCase(normalizedRole)) {
                reply = accessDeniedMsg;
            } else {
                long lowStock = productRepository.countByQuantityLessThan(10);
                Double revenue = incomeRepository.findAll().stream().mapToDouble(i -> i.getAmount() != null ? i.getAmount() : 0.0).sum();
                Double expenses = expenseRepository.findAll().stream().mapToDouble(e -> e.getAmount() != null ? e.getAmount() : 0.0).sum();
                long totalEmp = employeeRepository.count();
                List<Attendance> todayAtt = attendanceRepository.findByDate(today);
                long present = todayAtt.stream().filter(a -> "PRESENT".equalsIgnoreCase(a.getStatus()) || "LATE".equalsIgnoreCase(a.getStatus())).count();
                double attendanceRate = totalEmp > 0 ? (present * 100.0) / totalEmp : 100.0;

                reply = "### 🚨 Business Risk Detection\n" +
                        "1. **Inventory Risk:** " + (lowStock > 3 ? "HIGH" : "LOW") + " (" + lowStock + " products below safety limits. Recommendation: Generate purchase orders.)\n" +
                        "2. **Finance Risk:** " + (expenses > revenue ? "HIGH" : "LOW") + " (" + (expenses > revenue ? "Outflows exceed inflows today. Recommendation: Cut discretionary overhead." : "Profit margins are positive.") + ")\n" +
                        "3. **HR Risk:** " + (attendanceRate < 80.0 ? "MEDIUM" : "LOW") + " (Workforce presence at " + String.format("%.1f%%", attendanceRate) + ". Recommendation: Follow up on absences.)";
                
                context.lastIntent = "BUSINESS_RISKS";
            }
        } else if ("SMART_RECOMMENDATIONS".equalsIgnoreCase(winningIntent)) {
            if (!"ADMIN".equalsIgnoreCase(normalizedRole)) {
                reply = accessDeniedMsg;
            } else {
                long lowStock = productRepository.countByQuantityLessThan(10);
                long pendingPO = purchaseRequestRepository.findAll().stream().filter(pr -> "PENDING".equalsIgnoreCase(pr.getStatus())).count();
                long pendingLeaves = leaveRepository.countByStatus("PENDING");

                reply = "### 💡 Smart Recommendations\n" +
                        (lowStock > 0 ? "* **Restock Inventory:** " + lowStock + " items are low in stock. Place replenishing purchases immediately.\n" : "") +
                        (pendingPO > 0 ? "* **Approve POs:** " + pendingPO + " purchase orders are stalled. Authorize PO approvals to prevent supply delays.\n" : "") +
                        (pendingLeaves > 0 ? "* **Approve HR Leaves:** " + pendingLeaves + " leave requests pending. Review scheduling coverage." : "");
                
                context.lastIntent = "SMART_RECOMMENDATIONS";
            }
        } else if ("EMPLOYEE_INSIGHTS".equalsIgnoreCase(winningIntent)) {
            if (!"ADMIN".equalsIgnoreCase(normalizedRole) && !"HR".equalsIgnoreCase(normalizedRole)) {
                reply = accessDeniedMsg;
            } else {
                List<com.erp.backend.entity.hr.LeaveRequest> pendingLeaves = leaveRepository.findAll().stream().filter(l -> "PENDING".equalsIgnoreCase(l.getStatus())).collect(Collectors.toList());
                String leaveLines = pendingLeaves.isEmpty() ? "* No pending leave requests today." : pendingLeaves.stream().limit(3).map(l -> "* Leave: Employee ID " + l.getEmployeeId() + " (" + l.getLeaveType() + ")").collect(Collectors.joining("\n"));
                
                // Promotion ready
                List<com.erp.backend.entity.performance.EmployeePerformance> topPerformance = performanceRepository.findAll().stream()
                        .filter(p -> p.getScore() != null && p.getScore() >= 90.0)
                        .limit(2).collect(Collectors.toList());
                String promotionReady = topPerformance.isEmpty() ? "* No employees currently flagged ready for promotion." : topPerformance.stream().map(p -> "* Promotion Ready: Employee ID " + p.getEmployeeId() + " (Score: " + p.getScore() + ")").collect(Collectors.joining("\n"));

                reply = "### 👥 Employee Insights & HR Intelligence\n" +
                        "**Leaves & Absence:**\n" + leaveLines + "\n\n" +
                        "**Career Development:**\n" + promotionReady + "\n\n" +
                        "**HR Warnings:**\n" +
                        "* Check staff with high absenteeism or performance reviews below 60.";
                
                context.lastIntent = "EMPLOYEE_INSIGHTS";
            }
        } else if ("INVENTORY_INTELLIGENCE".equalsIgnoreCase(winningIntent)) {
            if (!"ADMIN".equalsIgnoreCase(normalizedRole) && !"INVENTORY".equalsIgnoreCase(normalizedRole)) {
                reply = accessDeniedMsg;
            } else {
                long productCount = productRepository.count();
                double valuation = productRepository.findAll().stream()
                        .mapToDouble(p -> (p.getQuantity() != null ? p.getQuantity() : 0) * (p.getPrice() != null ? p.getPrice() : 0.0))
                        .sum();
                List<Product> lowStock = productRepository.findAll().stream()
                        .filter(p -> p.getQuantity() != null && p.getQuantity() < (p.getMinStockLevel() != null ? p.getMinStockLevel() : 10))
                        .limit(3).collect(Collectors.toList());
                String reorderString = lowStock.isEmpty() ? "* Catalog is fully stocked." : lowStock.stream().map(p -> "* " + p.getProductName() + " (Qty: " + p.getQuantity() + " / Min: " + (p.getMinStockLevel() != null ? p.getMinStockLevel() : 10) + ")").collect(Collectors.joining("\n"));

                reply = "### 📦 Inventory Intelligence\n" +
                        "* **Total Catalog Lines:** " + productCount + " products\n" +
                        "* **Inventory Valuation:** ₹" + String.format("%,.2f", valuation) + "\n\n" +
                        "**Reorder Items:**\n" + reorderString;
                
                context.lastIntent = "INVENTORY_INTELLIGENCE";
            }
        } else if ("FINANCE_INTELLIGENCE".equalsIgnoreCase(winningIntent)) {
            if (!"ADMIN".equalsIgnoreCase(normalizedRole) && !"FINANCE".equalsIgnoreCase(normalizedRole)) {
                reply = accessDeniedMsg;
            } else {
                Double revenue = incomeRepository.findAll().stream().mapToDouble(i -> i.getAmount() != null ? i.getAmount() : 0.0).sum();
                Double expenses = expenseRepository.findAll().stream().mapToDouble(e -> e.getAmount() != null ? e.getAmount() : 0.0).sum();
                Double profit = revenue - expenses;
                
                // Highest expense
                List<Expense> allExpenses = expenseRepository.findAll();
                String highestExpenseLine = "* No expenses logged.";
                if (!allExpenses.isEmpty()) {
                    Expense maxExpense = allExpenses.stream().max(Comparator.comparingDouble(Expense::getAmount)).orElse(null);
                    if (maxExpense != null) {
                        highestExpenseLine = "* **Outflow Outlier:** " + maxExpense.getExpenseName() + " (₹" + String.format("%,.2f", maxExpense.getAmount()) + ")";
                    }
                }

                reply = "### 💵 Financial cash flow Summary\n" +
                        "* **Revenue:** ₹" + String.format("%,.2f", revenue) + "\n" +
                        "* **Expenses:** ₹" + String.format("%,.2f", expenses) + "\n" +
                        "* **Profit:** ₹" + String.format("%,.2f", profit) + "\n\n" +
                        highestExpenseLine;
                
                context.lastIntent = "FINANCE_INTELLIGENCE";
            }
        } else if ("SALES_INTELLIGENCE".equalsIgnoreCase(winningIntent)) {
            if (!"ADMIN".equalsIgnoreCase(normalizedRole) && !"SALES".equalsIgnoreCase(normalizedRole)) {
                reply = accessDeniedMsg;
            } else {
                Map<String, Double> customerSales = salesOrderRepository.findAll().stream()
                        .collect(Collectors.groupingBy(SalesOrder::getCustomerName, Collectors.summingDouble(SalesOrder::getTotalAmount)));
                String topCustomer = customerSales.entrySet().stream()
                        .max(Map.Entry.comparingByValue())
                        .map(entry -> entry.getKey() + " (₹" + String.format("%,.2f", entry.getValue()) + ")")
                        .orElse("No customer orders.");

                Map<String, Integer> productSales = salesOrderRepository.findAll().stream()
                        .collect(Collectors.groupingBy(SalesOrder::getProductName, Collectors.summingInt(SalesOrder::getQuantity)));
                String topProduct = productSales.entrySet().stream()
                        .max(Map.Entry.comparingByValue())
                        .map(entry -> entry.getKey() + " (" + entry.getValue() + " units)")
                        .orElse("No product sales.");

                reply = "### 📈 Sales & Billing Intelligence\n" +
                        "* **Top Selling Product:** " + topProduct + "\n" +
                        "* **Best Client Account:** " + topCustomer;
                
                context.lastIntent = "SALES_INTELLIGENCE";
            }
        } else if ("SUPPLIER_INTELLIGENCE".equalsIgnoreCase(winningIntent)) {
            if (!"ADMIN".equalsIgnoreCase(normalizedRole) && !"INVENTORY".equalsIgnoreCase(normalizedRole)) {
                reply = accessDeniedMsg;
            } else {
                List<com.erp.backend.entity.inventory.Supplier> suppliers = supplierRepository.findAll();
                String bestSupplier = suppliers.stream().max(Comparator.comparingDouble(s -> s.getPerformanceScore() != null ? s.getPerformanceScore() : 90.0))
                        .map(s -> s.getName() + " (Score: " + (s.getPerformanceScore() != null ? s.getPerformanceScore() : 90.0) + ")").orElse("N/A");
                String worstSupplier = suppliers.stream().min(Comparator.comparingDouble(s -> s.getPerformanceScore() != null ? s.getPerformanceScore() : 90.0))
                        .map(s -> s.getName() + " (Score: " + (s.getPerformanceScore() != null ? s.getPerformanceScore() : 90.0) + ")").orElse("N/A");

                reply = "### 🤝 Supplier intelligence\n" +
                        "* **Best Supplier:** " + bestSupplier + "\n" +
                        "* **Underperforming Supplier:** " + worstSupplier;
                
                context.lastIntent = "SUPPLIER_INTELLIGENCE";
            }
        } else if ("PREDICTIVE_INSIGHTS".equalsIgnoreCase(winningIntent)) {
            // Call existing forecast services
            Map<String, Object> salesForecast = new HashMap<>();
            try {
                salesForecast = dashboardService.getSalesForecast();
            } catch (Exception e) {
                salesForecast.put("error", "Insufficient data");
            }
            
            Map<String, Object> attForecast = new HashMap<>();
            try {
                attForecast = dashboardService.getAttendanceForecast();
            } catch (Exception e) {
                attForecast.put("error", "Insufficient data");
            }

            String salesLine = salesForecast.containsKey("error") ? "* **Sales Projection:** Insufficient historical sales data available." : "* **Sales Projection:** Next month expected revenue: ₹" + String.format("%,.2f", salesForecast.get("predictedSalesNextMonth")) + " (Growth: " + salesForecast.get("growthPct") + "%)";
            String attLine = attForecast.containsKey("error") ? "* **Attendance Projection:** Insufficient historical attendance data." : "* **Attendance Projection:** Expected attendance rate tomorrow: " + attForecast.get("predictedAttendanceRateTomorrow") + "%";

            reply = "### 🔮 Predictive AI Insights\n" +
                    salesLine + "\n" +
                    attLine + "\n\n" +
                    "**AI Reasoning:** Predictions utilize linear regression fitted over the last 30 days of ERP transactions.";
            
            context.lastIntent = "PREDICTIVE_INSIGHTS";
        } else if ("REPORTS".equalsIgnoreCase(winningIntent)) {
            reply = "### Available Report Commands\n" +
                    "* Ask to **'generate today's sales report'**\n" +
                    "* Ask to **'generate inventory summary'**\n" +
                    "* Ask to **'generate profit report'**";
        } else if ("AUDIT_LOGS".equalsIgnoreCase(winningIntent)) {
            if (!"ADMIN".equalsIgnoreCase(normalizedRole)) {
                reply = accessDeniedMsg;
            } else {
                List<AuditLog> recentLogs = auditLogRepository.findAll().stream()
                        .sorted((a, b) -> b.getActionTime().compareTo(a.getActionTime()))
                        .limit(5)
                        .collect(Collectors.toList());
                String logLines = recentLogs.stream()
                        .map(l -> "* [" + l.getActionTime().toString().replace("T", " ").substring(0, 19) + "] user `" + l.getUsername() + "` performed action `" + l.getAction() + "` in module `" + l.getModuleName() + "`")
                        .collect(Collectors.joining("\n"));
                if (logLines.isEmpty()) logLines = "* No audit logs tracked yet.";
                reply = "### Recent System Audit Logs\n" +
                        logLines;
            }
        } else if ("ATTENDANCE".equalsIgnoreCase(winningIntent)) {
            if (!"ADMIN".equalsIgnoreCase(normalizedRole) && !"HR".equalsIgnoreCase(normalizedRole)) {
                if (currentEmp != null) {
                    List<Attendance> myAtt = attendanceRepository.findAll().stream()
                            .filter(a -> a.getEmployeeId() != null && a.getEmployeeId().equals(currentEmp.getId()))
                            .collect(Collectors.toList());
                    String myAttLines = myAtt.isEmpty() ? "* No attendance records logged." : myAtt.stream().limit(5)
                            .map(a -> "* " + a.getDate() + ": " + a.getStatus()).collect(Collectors.joining("\n"));
                    reply = "### 📅 Your Attendance Record\n" + myAttLines;
                } else {
                    reply = accessDeniedMsg;
                }
            } else {
                List<Attendance> todayAtt = attendanceRepository.findByDate(today);
                long present = todayAtt.stream().filter(a -> "PRESENT".equalsIgnoreCase(a.getStatus()) || "LATE".equalsIgnoreCase(a.getStatus())).count();
                long totalEmp = employeeRepository.count();
                long absent = Math.max(0, totalEmp - present);
                
                List<Long> presentIds = todayAtt.stream()
                        .filter(a -> "PRESENT".equalsIgnoreCase(a.getStatus()) || "LATE".equalsIgnoreCase(a.getStatus()))
                        .map(Attendance::getEmployeeId)
                        .collect(Collectors.toList());
                String presentNames = "";
                if (!presentIds.isEmpty()) {
                    presentNames = employeeRepository.findAllById(presentIds).stream()
                            .map(e -> "* " + e.getName())
                            .collect(Collectors.joining("\n"));
                }
                if (presentNames.isEmpty()) presentNames = "* No check-ins logged today.";
                
                double rate = totalEmp > 0 ? (present * 100.0) / totalEmp : 100.0;
                
                reply = "### Today's Attendance Summary\n" +
                        "* **Present:** " + present + "\n" +
                        "* **Absent:** " + absent + "\n" +
                        "* **Workforce Rate:** " + String.format("%.1f%%", rate) + "\n\n" +
                        "**Present Staff:**\n" + presentNames;
                
                context.lastIntent = "ATTENDANCE";
            }
        } else if ("LEAVE".equalsIgnoreCase(winningIntent)) {
            if (!"ADMIN".equalsIgnoreCase(normalizedRole) && !"HR".equalsIgnoreCase(normalizedRole)) {
                if (currentEmp != null) {
                    List<com.erp.backend.entity.hr.LeaveRequest> myLeaves = leaveRepository.findAll().stream()
                            .filter(l -> l.getEmployeeId() != null && l.getEmployeeId().equals(currentEmp.getId()))
                            .collect(Collectors.toList());
                    String myLeaveLines = myLeaves.isEmpty() ? "* No leave requests filed." : myLeaves.stream().limit(5)
                            .map(l -> "* " + l.getFromDate() + " to " + l.getToDate() + ": " + l.getStatus() + " (" + l.getLeaveType() + ")").collect(Collectors.joining("\n"));
                    reply = "### ✉️ Your Leave Requests\n" + myLeaveLines;
                } else {
                    reply = accessDeniedMsg;
                }
            } else {
                List<com.erp.backend.entity.hr.LeaveRequest> pending = leaveRepository.findAll().stream()
                        .filter(l -> "PENDING".equalsIgnoreCase(l.getStatus())).collect(Collectors.toList());
                String pendingList = "";
                if (!pending.isEmpty()) {
                    List<Long> pendingEmployeeIds = pending.stream().map(com.erp.backend.entity.hr.LeaveRequest::getEmployeeId).collect(Collectors.toList());
                    pendingList = employeeRepository.findAllById(pendingEmployeeIds).stream()
                            .map(e -> "* " + e.getName())
                            .collect(Collectors.joining("\n"));
                }
                if (pendingList.isEmpty()) pendingList = "* No pending leave requests.";
                reply = "### Pending Leave Requests\n" +
                        "**" + pending.size() + " requests awaiting approval:**\n\n" +
                        pendingList;
                
                context.lastIntent = "LEAVE";
            }
        } else if ("FOLLOW_UP_DETAILS".equalsIgnoreCase(winningIntent)) {
            String priorIntent = context.lastIntent;
            if ("SALES_INTELLIGENCE".equalsIgnoreCase(priorIntent) || "FINANCE_INTELLIGENCE".equalsIgnoreCase(priorIntent) || "BUSINESS_SUMMARY".equalsIgnoreCase(priorIntent)) {
                if (!"ADMIN".equalsIgnoreCase(normalizedRole) && !"SALES".equalsIgnoreCase(normalizedRole) && !"FINANCE".equalsIgnoreCase(normalizedRole)) {
                    reply = accessDeniedMsg;
                } else {
                    Map<String, Double> customerSales = salesOrderRepository.findAll().stream()
                            .collect(Collectors.groupingBy(SalesOrder::getCustomerName, Collectors.summingDouble(SalesOrder::getTotalAmount)));
                    String topCustomer = customerSales.entrySet().stream()
                            .max(Map.Entry.comparingByValue())
                            .map(entry -> entry.getKey() + " (₹" + String.format("%,.2f", entry.getValue()) + ")")
                            .orElse("No customers found.");
                    reply = "### 🔍 Detail Query\n" +
                            "**Top Contributing Client Account:** " + topCustomer;
                }
            } else {
                reply = "No detail specifications found for the current query context.";
            }
        }

        if (role != null) {
            reply = "[" + role + " View] " + reply;
        }

        Map<String, Object> result = new HashMap<>();
        result.put("response", reply);
        return result;
    }
}
