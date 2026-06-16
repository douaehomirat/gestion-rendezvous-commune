package com.example.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "appointments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String ticket;
    private LocalDate date;
    private String time;
    private String serviceName;
    private LocalDateTime startDateTime;
    private LocalDateTime endDateTime;
    private String notes;
    private String counter;
    private String status;
    @Column(name="reminder_sent", nullable = false)
    private Boolean reminderSent = false;

    // 👤 CITIZEN
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "citizen_id", nullable = false)
    @JsonIgnoreProperties({"appointments", "password"})
    private User citizen;

    // 👨‍💼 AGENT
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "agent_id")
    @JsonIgnoreProperties({"appointments", "password"})
    private User agent;

    // 🏢 SERVICE / DEPARTMENT (IMPORTANT)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "department_id")
    @JsonIgnoreProperties({"agents"})
    private Department department;

    // ========================
    // FRONT SAFE FIELDS
    // ========================

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }


}