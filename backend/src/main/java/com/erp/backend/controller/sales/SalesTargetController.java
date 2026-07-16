package com.erp.backend.controller.sales;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.erp.backend.entity.sales.SalesTarget;
import com.erp.backend.service.sales.SalesTargetService;

@RestController
@RequestMapping({"/api/sales-target", "/api/sales/targets"})
@CrossOrigin("*")
public class SalesTargetController {

    @Autowired
    private SalesTargetService service;

    @PostMapping
    public SalesTarget addTarget(
            @RequestBody SalesTarget target){

        return service.saveTarget(target);
    }

    @GetMapping
    public List<SalesTarget> getTargets(){

        return service.getAllTargets();
    }
}