package com.erp.backend.repository.task;

import org.springframework.data.jpa.repository.JpaRepository;

import com.erp.backend.entity.task.Task;

public interface TaskRepository
        extends JpaRepository<Task, Long> {
    java.util.List<Task> findByEmployeeId(Long employeeId);
}