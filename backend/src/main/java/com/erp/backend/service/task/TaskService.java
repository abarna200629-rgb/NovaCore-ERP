package com.erp.backend.service.task;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.erp.backend.entity.task.Task;
import com.erp.backend.repository.task.TaskRepository;

@Service
public class TaskService {

    @Autowired
    private TaskRepository repository;

    public Task saveTask(Task task) {

        task.setStatus("PENDING");

        return repository.save(task);
    }

    public List<Task> getAllTasks() {

        return repository.findAll();
    }

    public void deleteTask(Long id) {

        repository.deleteById(id);
    }
}