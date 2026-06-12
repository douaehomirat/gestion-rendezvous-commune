package com.example.backend.controller;

import com.example.backend.dto.AgentDTO;
import com.example.backend.dto.PasswordDTO;
import com.example.backend.entity.Appointment;
import com.example.backend.entity.Department;
import com.example.backend.entity.User;
import com.example.backend.repository.DepartmentRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;




    @DeleteMapping("/citizens/{id}")
        public ResponseEntity<?> deleteCitizen(@PathVariable Long id) {
    userRepository.deleteById(id);
    return ResponseEntity.ok().build();
}

    // =========================
    // ALL USERS
    // =========================
    @GetMapping
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }

    // =========================
    // CITIZENS ONLY
    // =========================
    @GetMapping("/citizens")
    public List<User> getCitizens() {
        return userService.getUsersByRole("CITIZEN");
    }

    // =========================
    // AGENTS ONLY
    // =========================
    @GetMapping("/agents")
    public List<User> getAgents() {
        return userService.getUsersByRole("AGENT");
    }

    // =========================
    // GET USER BY ID
    // =========================
    @GetMapping("/{id}")
    public User getUser(@PathVariable Long id) {
        return userService.getUserById(id);
    }

    // =========================
    // CREATE AGENT
    // =========================
    @PostMapping("/agents")
    public User createAgent(@RequestBody AgentDTO dto) {

        Department dep = departmentRepository.findById(dto.getDepartementId())
                .orElseThrow(() -> new RuntimeException("Département introuvable"));

        User user = new User();

        user.setName(dto.getName());
        user.setEmail(dto.getEmail());
        user.setPhone(dto.getPhone());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));

        user.setBureau(dto.getBureau());
        user.setStatus(dto.getStatus());
        user.setRole("AGENT");
        user.setDepartement(dep);

        return userRepository.save(user);
    }

    // =========================
    // UPDATE USER
    // =========================
    @PutMapping("/{id}")
    public User updateUser(@PathVariable Long id, @RequestBody User data) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        user.setName(data.getName());
        user.setEmail(data.getEmail());
        user.setPhone(data.getPhone());
        user.setAddress(data.getAddress());
        user.setCity(data.getCity());
        user.setBureau(data.getBureau());
        user.setStatus(data.getStatus());
        user.setRole(data.getRole());

        if (data.getPassword() != null && !data.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(data.getPassword()));
        }

        if (data.getDepartement() != null &&
                data.getDepartement().getId() != null) {

            Department dep = departmentRepository.findById(
                    data.getDepartement().getId()
            ).orElseThrow(() -> new RuntimeException("Département introuvable"));

            user.setDepartement(dep);
        }

        return userRepository.save(user);
    }

    // =========================
    // CHANGE PASSWORD
    // =========================
    @PutMapping("/{id}/password")
    public ResponseEntity<?> changePassword(
            @PathVariable Long id,
            @RequestBody PasswordDTO dto) {

        userService.changePassword(id, dto);
        return ResponseEntity.ok("Password updated");
    }

    // =========================
    // DELETE USER
    // =========================
    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable Long id) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        userRepository.delete(user);
    }
}