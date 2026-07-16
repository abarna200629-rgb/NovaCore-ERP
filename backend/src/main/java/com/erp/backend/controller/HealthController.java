package com.erp.backend.controller;

import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/health")
@CrossOrigin("*")
public class HealthController {

    @GetMapping
    public Map<String, Object> checkHealth() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("message", "NovaCore ERP Backend is fully operational.");
        health.put("timestamp", new Date());
        return health;
    }
}
