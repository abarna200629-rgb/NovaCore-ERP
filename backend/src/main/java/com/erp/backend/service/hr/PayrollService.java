package com.erp.backend.service.hr;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.erp.backend.entity.Employee;
import com.erp.backend.entity.hr.Payroll;
import com.erp.backend.repository.EmployeeRepository;
import com.erp.backend.repository.hr.PayrollRepository;

@Service
public class PayrollService {

    @Autowired
    private PayrollRepository repository;

    @Autowired
    private EmployeeRepository employeeRepository;

    public Payroll savePayroll(Payroll payroll) {

        Employee employee =
                employeeRepository
                        .findById(
                                payroll.getEmployeeId()
                        )
                        .orElseThrow(
                                () ->
                                        new RuntimeException(
                                                "Employee Not Found"
                                        )
                        );

        payroll.setEmployeeName(
                employee.getName()
        );

        payroll.setDepartment(
                employee.getDepartment()
        );

        payroll.setBasicSalary(
                employee.getSalary()
        );

        // Bonus Null Check
        Double bonus =
                payroll.getBonus() == null
                        ? 0.0
                        : payroll.getBonus();

        // Manual Deduction Null Check
        Double deduction =
                payroll.getDeduction() == null
                        ? 0.0
                        : payroll.getDeduction();

        /*
         * FUTURE ERP FEATURES
         */

        // Attendance Based Deduction
        Integer absentDays =
                payroll.getAbsentDays() == null
                        ? 0
                        : payroll.getAbsentDays();

        Double perDaySalary =
                employee.getSalary() / 30;

        Double absentDeduction =
                perDaySalary * absentDays;

        // Late Penalty
        Integer lateCount =
                payroll.getLateCount() == null
                        ? 0
                        : payroll.getLateCount();

        Double lateDeduction = 0.0;

        if (lateCount > 5) {

            lateDeduction =
                    employee.getSalary() * 0.05;
        }

        // Task Completion Bonus
        Integer taskCompletion =
                payroll.getTaskCompletionPercentage() == null
                        ? 0
                        : payroll.getTaskCompletionPercentage();

        Double performanceBonus = 0.0;

        if (taskCompletion >= 100) {

            performanceBonus = 2000.0;

        } else if (taskCompletion >= 80) {

            performanceBonus = 1000.0;
        }

        // Total Salary Calculation
        Double netSalary =
                employee.getSalary()
                        + bonus
                        + performanceBonus
                        - deduction
                        - absentDeduction
                        - lateDeduction;

        payroll.setNetSalary(
                netSalary
        );

        return repository.save(payroll);
    }

    public List<Payroll> getAllPayroll() {

        return repository.findAll();
    }

    public void deletePayroll(Long id) {

        repository.deleteById(id);
    }

    public Employee getEmployee(Long id) {

        return employeeRepository
                .findById(id)
                .orElse(null);
    }
}