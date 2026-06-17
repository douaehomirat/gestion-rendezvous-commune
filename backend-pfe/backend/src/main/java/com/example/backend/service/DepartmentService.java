package com.example.backend.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.example.backend.entity.Department;
import com.example.backend.entity.User;
import com.example.backend.repository.DepartmentRepository;
import com.example.backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.text.Normalizer;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class DepartmentService {

    private final DepartmentRepository repository;
    private final UserRepository userRepository;
    private final Cloudinary cloudinary;

    // ================= GET ALL =================
    public List<Department> getAll() {
        return repository.findAll();
    }

    // ================= CREATE =================
    public Department create(Department d, MultipartFile file) {
        boolean exists = repository.existsByNameIgnoreCase(d.getName());

        if (exists) {
            throw new RuntimeException("Ce service existe déjà !");
        }

        if (d.getHeadAgent() != null && d.getHeadAgent().getId() != null) {
            User agent = userRepository.findById(d.getHeadAgent().getId())
                    .orElseThrow(() -> new RuntimeException("Agent introuvable"));
            d.setHeadAgent(agent);
        }

        if (file != null && !file.isEmpty()) {
            try {
                Map uploadResult = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                        "folder", "departments",
                        "resource_type", "raw"
                    )
                );
                d.setDocumentUrl((String) uploadResult.get("secure_url"));
            } catch (Exception e) {
                throw new RuntimeException("Upload Cloudinary failed: " + e.getMessage());
            }
        }

        return repository.save(d);
    }

    // ================= UPDATE =================
    public Department update(
            Long id,
            String name,
            String description,
            String phone,
            boolean active,
            Long headAgentId,
            MultipartFile file
    ) {
        Department dep = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Department not found"));

        dep.setName(name);
        dep.setDescription(description);
        dep.setPhone(phone);
        dep.setActive(active);

        boolean exists = repository.existsByNameIgnoreCase(dep.getName());
        if (exists && !repository.findById(dep.getId()).get().getName().equalsIgnoreCase(dep.getName())) {
            throw new RuntimeException("Ce service existe déjà !");
        }

        if (headAgentId != null) {
            User agent = userRepository.findById(headAgentId)
                    .orElseThrow(() -> new RuntimeException("Agent introuvable"));
            dep.setHeadAgent(agent);
        } else {
            dep.setHeadAgent(null);
        }

        if (file != null && !file.isEmpty()) {
            try {
                Map uploadResult = cloudinary.uploader().upload(
    file.getBytes(),
    ObjectUtils.asMap(
        "folder", "departments",
        "resource_type", "auto",
        "format", "pdf"
    )
);
                dep.setDocumentUrl((String) uploadResult.get("secure_url"));
            } catch (Exception e) {
                throw new RuntimeException("Upload Cloudinary failed: " + e.getMessage());
            }
        }

        return repository.save(dep);
    }

    // ================= DELETE =================
    public void delete(Long id) {
        repository.deleteById(id);
    }

    // ================= TOGGLE =================
    public Department toggle(Long id) {
        Department dep = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Department not found"));
        dep.setActive(!dep.isActive());
        return repository.save(dep);
    }

    // ================= SEARCH =================
    public Optional<Department> findByNameContainingIgnoreCase(String userInput) {
        String normalized = Normalizer.normalize(userInput, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                .toLowerCase()
                .trim();

        return repository.findAll()
                .stream()
                .filter(dept -> {
                    String deptNorm = Normalizer.normalize(dept.getName(), Normalizer.Form.NFD)
                            .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                            .toLowerCase();
                    return deptNorm.contains(normalized);
                })
                .findFirst();
    }

    // ================= TOGGLE DEPARTMENT =================
    @Transactional
    public void toggleDepartment(Long id) {
        Department dep = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Department not found"));

        boolean newStatus = !dep.isActive();
        dep.setActive(newStatus);

        String agentStatus = newStatus ? "active" : "inactive";
        userRepository.updateStatusByDepartementId(id, agentStatus);

        repository.save(dep);
    }
}