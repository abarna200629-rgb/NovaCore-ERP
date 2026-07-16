package com.erp.backend.controller.task;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.erp.backend.entity.task.Task;
import com.erp.backend.service.task.TaskService;

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin("*")
public class TaskController {

    @Autowired
    private TaskService service;

    @PostMapping
    public Task saveTask(
            @RequestBody Task task) {

        return service.saveTask(task);
    }

    @GetMapping
    public List<Task> getTasks() {

        return service.getAllTasks();
    }

    @DeleteMapping("/{id}")
    public String deleteTask(
            @PathVariable Long id) {

        service.deleteTask(id);

        return "Deleted";
    }
}