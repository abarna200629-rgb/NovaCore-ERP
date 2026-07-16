package com.erp.backend.service.performance;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import java.util.Set;
import java.util.HashSet;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.erp.backend.entity.Employee;
import com.erp.backend.entity.performance.EmployeePerformance;
import com.erp.backend.entity.sales.SalesTarget;
import com.erp.backend.entity.sales.SalesOrder;
import com.erp.backend.repository.EmployeeRepository;
import com.erp.backend.repository.performance.EmployeePerformanceRepository;
import com.erp.backend.repository.sales.SalesTargetRepository;
import com.erp.backend.repository.sales.SalesOrderRepository;

@Service
public class EmployeePerformanceService {

    @Autowired
    private EmployeePerformanceRepository repository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private SalesTargetRepository salesTargetRepository;

    @Autowired
    private SalesOrderRepository salesOrderRepository;

    @Autowired
    private com.erp.backend.repository.inventory.ProductRepository productRepository;

    public EmployeePerformance savePerformance(EmployeePerformance performance) {
        Employee employee = employeeRepository.findById(performance.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee Not Found"));

        performance.setEmployeeName(employee.getName());
        performance.setDepartment(employee.getDepartment() != null ? employee.getDepartment() : "Sales");
        performance.setLastUpdated(LocalDateTime.now().toString());

        Double score = performance.getScore() != null ? performance.getScore() : 50.0;
        String rating;

        if (score >= 95.0) {
            rating = "EXCELLENT";
        } else if (score >= 85.0) {
            rating = "GOOD";
        } else if (score >= 70.0) {
            rating = "AVERAGE";
        } else {
            rating = "POOR";
        }

        performance.setRating(rating);
        EmployeePerformance saved = repository.save(performance);
        recalculateAll();
        return saved;
    }

    public List<EmployeePerformance> getAllPerformance() {
        recalculateAll();
        List<EmployeePerformance> all = repository.findAll();
        List<Employee> activeEmployees = employeeRepository.findByStatusIgnoreCase("ACTIVE");
        
        java.util.Set<Long> activeEmployeeIds = activeEmployees.stream()
                .map(Employee::getId)
                .collect(java.util.stream.Collectors.toSet());
                
        return all.stream()
                .filter(p -> p.getEmployeeId() != null && activeEmployeeIds.contains(p.getEmployeeId()))
                .collect(java.util.stream.Collectors.toList());
    }

    public void deletePerformance(Long id) {
        repository.deleteById(id);
    }

    // =====================================
    // CORE LIVE SYNCHRONIZATION ENGINE
    // =====================================

    public void recalculateAll() {
        List<SalesTarget> targets = salesTargetRepository.findAll();
        List<SalesOrder> orders = salesOrderRepository.findAll();

        // 0. Self-heal and repair legacy target records
        for (SalesTarget target : targets) {
            boolean changed = false;
            
            // Repair null monthName from deadline
            if (target.getMonthName() == null && target.getDeadline() != null) {
                String name = target.getDeadline().getMonth().toString();
                target.setMonthName(name.substring(0, 1).toUpperCase() + name.substring(1).toLowerCase());
                changed = true;
            }
            
            // Repair null productId from productName
            if (target.getProductId() == null && target.getProductName() != null) {
                com.erp.backend.entity.inventory.Product p = productRepository.findByProductName(target.getProductName()).orElse(null);
                if (p != null) {
                    target.setProductId(p.getId());
                    changed = true;
                }
            }
            
            // Repair null employeeId from employeeName
            if (target.getEmployeeId() == null && target.getEmployeeName() != null) {
                Employee e = employeeRepository.findAll().stream()
                    .filter(emp -> emp.getName().equalsIgnoreCase(target.getEmployeeName()))
                    .findFirst().orElse(null);
                if (e != null) {
                    target.setEmployeeId(e.getId());
                    changed = true;
                }
            }
            
            if (changed) {
                salesTargetRepository.save(target);
            }
        }

        // Refresh targets list after self-healing updates
        targets = salesTargetRepository.findAll();

        // 1. Recalculate achieved quantity for every SalesTarget from actual SalesOrders
        for (SalesTarget target : targets) {
            int achieved = 0;
            for (SalesOrder order : orders) {
                boolean employeeMatches = false;
                if (order.getEmployeeId() != null && target.getEmployeeId() != null) {
                    employeeMatches = order.getEmployeeId().equals(target.getEmployeeId());
                } else if (order.getEmployeeName() != null && target.getEmployeeName() != null) {
                    employeeMatches = order.getEmployeeName().equalsIgnoreCase(target.getEmployeeName());
                }

                boolean productMatches = false;
                if (order.getProductId() != null && target.getProductId() != null) {
                    productMatches = order.getProductId().equals(target.getProductId());
                } else if (order.getProductName() != null && target.getProductName() != null) {
                    productMatches = order.getProductName().equalsIgnoreCase(target.getProductName());
                }

                if (employeeMatches && productMatches) {
                    String orderMonth = getMonthNameFromDate(order.getOrderDate());
                    if (orderMonth != null && target.getMonthName() != null && orderMonth.equalsIgnoreCase(target.getMonthName())) {
                        achieved += (order.getQuantity() != null ? order.getQuantity() : 0);
                    }
                }
            }
            target.setAchievedQuantity(achieved);
            calculatePerformanceForTarget(target);
            salesTargetRepository.save(target);
        }

        // 2. Aggregate and update EmployeePerformance records dynamically
        Set<String> employeeMonthPairs = new HashSet<>();
        for (SalesTarget target : targets) {
            if (target.getEmployeeId() != null && target.getMonthName() != null) {
                employeeMonthPairs.add(target.getEmployeeId() + ":" + target.getMonthName());
            }
        }

        for (String pair : employeeMonthPairs) {
            String[] parts = pair.split(":");
            Long empId = Long.parseLong(parts[0]);
            String month = parts[1];

            Employee employee = employeeRepository.findById(empId).orElse(null);
            if (employee == null) continue;

            List<SalesTarget> empTargets = targets.stream()
                .filter(t -> empId.equals(t.getEmployeeId()) && month.equalsIgnoreCase(t.getMonthName()))
                .collect(Collectors.toList());

            int totalTarget = empTargets.stream().mapToInt(t -> t.getTargetQuantity() != null ? t.getTargetQuantity() : 0).sum();
            int totalAchieved = empTargets.stream().mapToInt(t -> t.getAchievedQuantity() != null ? t.getAchievedQuantity() : 0).sum();

            double achievementPercentage = 0.0;
            if (totalTarget > 0) {
                achievementPercentage = (totalAchieved * 100.0) / totalTarget;
            }

            double score = 50.0;
            if (achievementPercentage >= 120.0) {
                score = 100.0;
            } else if (achievementPercentage >= 100.0) {
                score = 95.0;
            } else if (achievementPercentage >= 80.0) {
                score = 85.0;
            } else if (achievementPercentage >= 60.0) {
                score = 70.0;
            }

            String rating = "POOR";
            if (score >= 95.0) {
                rating = "EXCELLENT";
            } else if (score >= 85.0) {
                rating = "GOOD";
            } else if (score >= 70.0) {
                rating = "AVERAGE";
            }

            EmployeePerformance performance = repository.findByEmployeeIdAndMonthName(empId, month)
                .orElse(new EmployeePerformance());

            performance.setEmployeeId(empId);
            performance.setEmployeeName(employee.getName());
            performance.setMonthName(month);
            performance.setScore(score);
            performance.setRating(rating);
            performance.setDepartment(employee.getDepartment() != null ? employee.getDepartment() : "Sales");
            performance.setTargetQuantity(totalTarget);
            performance.setAchievedQuantity(totalAchieved);
            performance.setAchievementPercentage(achievementPercentage);
            performance.setLastUpdated(LocalDateTime.now().toString());

            repository.save(performance);
        }
    }

    private void calculatePerformanceForTarget(SalesTarget target) {
        int targetQty = target.getTargetQuantity() != null ? target.getTargetQuantity() : 1;
        if (targetQty <= 0) {
            targetQty = 1;
        }
        int achievedQty = target.getAchievedQuantity() != null ? target.getAchievedQuantity() : 0;

        double actualPercentage = (achievedQty * 100.0) / targetQty;
        target.setAchievementPercentage(actualPercentage);

        int extraSales = Math.max(0, achievedQty - targetQty);
        target.setExtraSales(extraSales);

        double overAchievement = Math.max(0, actualPercentage - 100.0);
        target.setOverAchievementPercentage(overAchievement);

        if (actualPercentage >= 100) {
            target.setRating("EXCELLENT");
            target.setCompletionStatus("COMPLETED");
            target.setCompletedDate(LocalDate.now());
        } else if (actualPercentage >= 80) {
            target.setRating("GOOD");
            target.setCompletionStatus("IN PROGRESS");
            target.setCompletedDate(null);
        } else if (actualPercentage >= 50) {
            target.setRating("AVERAGE");
            target.setCompletionStatus("IN PROGRESS");
            target.setCompletedDate(null);
        } else {
            target.setRating("POOR");
            target.setCompletionStatus("IN PROGRESS");
            target.setCompletedDate(null);
        }
    }

    private String getMonthNameFromDate(String dateStr) {
        if (dateStr == null) return "";
        try {
            LocalDate date = LocalDate.parse(dateStr);
            String name = date.getMonth().toString(); // e.g. "JULY"
            return name.substring(0, 1).toUpperCase() + name.substring(1).toLowerCase(); // e.g. "July"
        } catch (Exception e) {
            return dateStr; // fallback
        }
    }
}