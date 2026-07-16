package com.erp.backend.controller.hr;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.erp.backend.entity.hr.Candidate;
import com.erp.backend.repository.hr.CandidateRepository;

@RestController
@RequestMapping("/api/hr/recruitment")
@CrossOrigin("*")
public class RecruitmentController {

    @Autowired
    private CandidateRepository repository;

    @GetMapping
    public List<Candidate> getAllCandidates() {
        return repository.findAll();
    }

    @PostMapping
    public Candidate logCandidate(@RequestBody Candidate candidate) {
        return repository.save(candidate);
    }

    @PutMapping("/{id}")
    public Candidate updateCandidateStatus(@PathVariable Long id, @RequestBody Candidate candidateDetails) {
        Candidate candidate = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Candidate not found with id: " + id));
        candidate.setStatus(candidateDetails.getStatus());
        return repository.save(candidate);
    }
}
