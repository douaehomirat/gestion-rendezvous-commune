package com.example.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})

public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Infos communes
    private String name;
    private String email;
    private String phone;
    private String password;
    private LocalDateTime createdAt;

    // Pour citoyen
    private String address;
    private String city;

    // Pour agent
    private String bureau;
    private String status;
    private String location;

    // Role : CITIZEN / AGENT / ADMIN
    private String role;

    // Département (pour agent)
    @ManyToOne
    @JoinColumn(name = "departement_id")
    @JsonIgnoreProperties({"agents", "headAgent"})
    private Department departement;

    // Rendez-vous (pour citoyen)
    @OneToMany(mappedBy = "citizen", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Appointment> appointments;



    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Notification> notifications;


}