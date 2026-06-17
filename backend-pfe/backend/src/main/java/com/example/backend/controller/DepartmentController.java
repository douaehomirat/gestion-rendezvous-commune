package com.example.backend.controller;

import com.example.backend.entity.Department;
import com.example.backend.entity.User;
import com.example.backend.repository.DepartmentRepository;
import com.example.backend.service.DepartmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/departments")
@CrossOrigin(origins ="https://incredible-tapioca-00c427.netlify.app")
@RequiredArgsConstructor
public class DepartmentController {

    private final DepartmentService service;
    private final DepartmentRepository repository;

    @GetMapping
    public List<Department> getAll() {
        return service.getAll();
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Department create(
            @RequestParam String name,
            @RequestParam String description,
            @RequestParam String phone,
            @RequestParam boolean active,
            @RequestParam(required = false) Long headAgentId,
            @RequestParam(required = false) MultipartFile file
    ) {
        Department d = new Department();
        d.setName(name);
        d.setDescription(description);
        d.setPhone(phone);
        d.setActive(active);

        if (headAgentId != null) {
            User agent = new User();
            agent.setId(headAgentId);
            d.setHeadAgent(agent);
        }

        return service.create(d, file);
    }
    @PutMapping(
            value = "/{id}",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public Department update(
            @PathVariable Long id,
            @RequestParam String name,
            @RequestParam String description,
            @RequestParam String phone,
            @RequestParam boolean active,
            @RequestParam(required = false) Long headAgentId,
            @RequestParam(required = false) MultipartFile file
    ) {
        return service.update(id, name, description, phone, active, headAgentId, file);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }




    @PutMapping("/{id}/toggle")
    public ResponseEntity<?> toggleDepartment(@PathVariable Long id) {

        service.toggleDepartment(id);

        return ResponseEntity.ok(
                Map.of(
                        "message", "Department status updated successfully"
                )
        );
    }



}