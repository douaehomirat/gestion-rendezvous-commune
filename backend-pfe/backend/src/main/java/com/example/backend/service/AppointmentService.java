package com.example.backend.service;

import com.example.backend.dto.AppointmentCalendarDTO;
import com.example.backend.dto.AppointmentRequest;
import com.example.backend.dto.HistoryDTO;
import com.example.backend.entity.Appointment;
import com.example.backend.entity.User;
import com.example.backend.enums.NotificationType;
import com.example.backend.enums.StatutRdv;
import com.example.backend.repository.AppointmentRepository;
import com.example.backend.repository.NotificationRepository;
import com.example.backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.backend.entity.Notification;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

import org.springframework.messaging.simp.SimpMessagingTemplate;

@Service
public class AppointmentService {

    private static final Logger log = LoggerFactory.getLogger(AppointmentService.class);

    private final AppointmentRepository repo;
    private final UserRepository userRepo;
    private final EmailService emailService;
    private final NotificationRepository nRepo;
    private final NotificationService notificationService; // ← injecter
        private AppointmentRequest dto;
    private final SimpMessagingTemplate messagingTemplate;


    public AppointmentRepository getRepo() {
        return repo;
    }

    public AppointmentService(NotificationService notificationService, AppointmentRepository repo, SimpMessagingTemplate messagingTemplate, UserRepository userRepo, EmailService emailService, NotificationRepository nRepo) {
        this.nRepo = nRepo;
        this.userRepo = userRepo;
        this.repo = repo;
        this.emailService = emailService;
        this.messagingTemplate = messagingTemplate;
        this.notificationService = notificationService;
    }


    // AppointmentService.java
    public Appointment save(Appointment appointment) {
        System.out.println("💾 === CREATION RDV ===");

        if (appointment.getCitizen() == null) {
            System.err.println("❌ ERREUR: Aucun citoyen fourni !");
            return null;
        }

        System.out.println("Citoyen ID: " + appointment.getCitizen().getId());

        // ✅ Sauvegarde
        Appointment saved = repo.save(appointment);

        System.out.println("✅ RDV sauvé ID: " + saved.getId());

        // ✅ Sécurisation
        if (saved.getCitizen() == null) {
            System.err.println("❌ RDV sans citoyen après save !");
            return saved;
        }

        // ✅ Nom citoyen
        String citizenName = saved.getCitizen().getName() != null
                ? saved.getCitizen().getName()
                : "Utilisateur #" + saved.getCitizen().getId();

        // ✅ Service sécurisé
        String service = (saved.getDepartment() != null && saved.getDepartment().getName() != null)
                ? saved.getDepartment().getName()
                : "Service inconnu";

        System.out.println("👤 Citoyen: " + citizenName + " | Service: " + service);

        // 🔥 1. ADMIN
        notificationService.notifyRole(
                "ADMIN",
                "🆕 Nouveau rendez-vous #" + saved.getId(),
                citizenName + " a pris RDV (" + service + ")",
                NotificationType.RENDEZ_VOUS
        );

        // 🔥 2. AGENTS
        notificationService.notifyRole(
                "AGENT",
                "📋 RDV à traiter #" + saved.getId(),
                citizenName + " - Service: " + service + " - Statut: " + saved.getStatus(),
                NotificationType.RENDEZ_VOUS
        );

        return saved;
    }

    public List<Appointment> getAll() {
        return repo.findAll();
    }

    public List<Appointment> getByAgent(Long agentId) {
        return repo.findByAgent_Id(agentId);
    }

    public Appointment getById(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
    }

    public Appointment update(Long id, Appointment newApp) {
        Appointment app = getById(id);
        app.setNotes(newApp.getNotes());
        app.setStatus(newApp.getStatus());
        app.setDate(newApp.getDate());
        app.setTime(newApp.getTime());
        app.setStartDateTime(newApp.getStartDateTime());
        app.setEndDateTime(newApp.getEndDateTime());

        return repo.save(app);
    }

    public void delete(Long id) {
        repo.deleteById(id);
    }

    public AppointmentRequest toDTO(Appointment a) {
        AppointmentRequest dto = new AppointmentRequest();
        dto.setId(a.getId());
        dto.setTicket(a.getTicket());
        dto.setNotes(a.getNotes());
        dto.setStatus(a.getStatus());
        dto.setDate(a.getDate());
        dto.setTime(a.getTime());
        dto.setStartDateTime(a.getStartDateTime());
        dto.setEndDateTime(a.getEndDateTime());

        if (a.getCitizen() != null) {
            dto.setCitizenId(a.getCitizen().getId());
            dto.setCitizenName(a.getCitizen().getName());
        }
        if (a.getAgent() != null) {
            dto.setAgentId(a.getAgent().getId());
            dto.setAgentName(a.getAgent().getName());
            dto.setBureau(a.getAgent().getBureau());
        }
        if (a.getDepartment() != null) {
            dto.setDepartmentId(a.getDepartment().getId());
            dto.setServiceName(a.getDepartment().getName());
        }
        return dto;
    }

    // ✅ CORRIGÉ : logs détaillés pour déboguer
    private boolean checkConflict(Long agentId, LocalDateTime start, LocalDateTime end) {
        System.out.println("=== CONFLICT CHECK ===");
        System.out.println("agentId = " + agentId);
        System.out.println("start   = " + start);
        System.out.println("end     = " + end);
        boolean result = repo.existsConflict(agentId, start, end);
        System.out.println("CONFLICT RESULT = " + result);
        return result;
    }

    public HistoryDTO toHistoryDTO(Appointment a) {
        HistoryDTO dto = new HistoryDTO();
        dto.setId(a.getId());
        dto.setStatus(a.getStatus());
        dto.setDescription(a.getNotes());
        dto.setType("Rendez-vous");
        if (a.getStartDateTime() != null) {
            dto.setDate(a.getStartDateTime().toLocalDate().toString());
        } else {
            dto.setDate(null);
        }
        return dto;
    }

    public List<HistoryDTO> getHistoryByCitizen(Long citizenId) {
        return repo.findByCitizen_Id(citizenId)
                .stream()
                .map(this::toHistoryDTO)
                .toList();
    }


    // ✅ CORRIGÉ : logs ajoutés pour vérifier le comportement
    public User findBestAvailableAgent(Long departmentId, LocalDateTime start, LocalDateTime end) {
        List<User> agents = userRepo.findByDepartement_Id(departmentId);

        // Début et fin de la semaine du RDV
        LocalDateTime startOfWeek = start.toLocalDate()
                .with(java.time.DayOfWeek.MONDAY)
                .atStartOfDay();
        LocalDateTime endOfWeek = start.toLocalDate()
                .with(java.time.DayOfWeek.FRIDAY)
                .atTime(23, 59, 59);

        System.out.println("=== FIND BEST AGENT ===");
        System.out.println("semaine : " + startOfWeek + " → " + endOfWeek);

        User bestAgent = null;
        int minAppointments = Integer.MAX_VALUE;

        for (User agent : agents) {
            boolean busy = repo.existsConflict(agent.getId(), start, end);
            System.out.println("agent " + agent.getId() + " busy=" + busy);

            if (!busy) {
                // ✅ Compter sur toute la semaine
                int count = repo.countAppointmentsByAgentAndPeriod(
                        agent.getId(),
                        startOfWeek,
                        endOfWeek
                );
                System.out.println("  -> RDV cette semaine: " + count);
                if (count < minAppointments) {
                    minAppointments = count;
                    bestAgent = agent;
                }
            }
        }

        System.out.println("bestAgent = " + (bestAgent != null ? bestAgent.getId() : "NULL"));
        return bestAgent;
    }

    public List<AppointmentRequest> getByCitizen(Long citizenId) {
        return repo.findFullByCitizenId(citizenId)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    public AppointmentCalendarDTO toCalendarDTO(Appointment a) {
        AppointmentCalendarDTO dto = new AppointmentCalendarDTO();
        dto.id = a.getId();
        dto.title =
                (a.getDepartment() != null ? a.getDepartment().getName() : "Service")
                        + " - " +
                        (a.getCitizen() != null ? a.getCitizen().getName() : "");
        dto.start = a.getStartDateTime() != null ? a.getStartDateTime().toString() : null;
        dto.end = a.getEndDateTime() != null ? a.getEndDateTime().toString() : null;
        dto.status = a.getStatus();
        dto.citizen = a.getCitizen() != null ? a.getCitizen().getName() : null;
        dto.service = a.getDepartment() != null ? a.getDepartment().getName() : null;
        return dto;
    }

    public List<Appointment> getTodayQueue() {
        return repo.findByDateAndStatus(
                LocalDate.now(),
                "waiting"
        );
    }

    public List<Appointment> getAgentSchedule(User agent) {
        return repo.findByDateAndAgent(
                LocalDate.now(),
                agent
        );
    }

    public Appointment callCitizen(Long id) {
        Appointment appt = repo.findById(id)
                .orElseThrow();

        appt.setStatus("in_progress");

        return repo.save(appt);
    }

    public List<Appointment> getAppointmentsByAgent(Long agentId) {
        return repo.findAllByAgentId(agentId);
    }

    public void sendReminderEmail(String email, String name, String date, String time) {
        try {
            emailService.sendEmail(
                    email,
                    "Rappel de rendez-vous",
                    "Bonjour " + name +
                            ",\n\nVous avez un rendez-vous prévu pour " +
                            date + " à " + time
            );
        } catch (Exception e) {
            log.error("Failed to send reminder email to {}: {}", email, e.getMessage());
        }
    }





    public List<Map<String, Object>> getAutoSlots(Long departmentId, LocalDate date) {

        List<User> agents = userRepo.findByDepartement_Id(departmentId);

        List<LocalTime[]> ranges = List.of(
                new LocalTime[]{LocalTime.of(8, 0), LocalTime.of(12, 0)},
                new LocalTime[]{LocalTime.of(14, 0), LocalTime.of(17, 0)}
        );

        List<Map<String, Object>> result = new ArrayList<>();

        for (LocalTime[] range : ranges) {
            for (LocalTime time = range[0]; time.isBefore(range[1]); time = time.plusMinutes(15)) {

                LocalDateTime start = LocalDateTime.of(date, time);
                LocalDateTime end = start.plusMinutes(15
                );


                long availableAgents = agents.stream()
                        .filter(agent -> !repo.existsConflict(
                                agent.getId(), start, end
                        ))
                        .count();

                Map<String, Object> slot = new HashMap<>();
                slot.put("time", time.toString());
                slot.put("availableAgents", availableAgents);

                result.add(slot);
            }
        }

        return result;
    }


    // AppointmentService.java
    public Appointment updateStatut(Long rdvId, StatutRdv nouveauStatut) {

        Appointment rdv = repo.findById(rdvId)
                .orElseThrow(() -> new RuntimeException("Rendez-vous introuvable"));

        rdv.setStatus(nouveauStatut.name());

        repo.save(rdv);

        // =========================
        // MESSAGE CITOYEN
        // =========================
        String titre;
        String message;

        switch (nouveauStatut) {

            case confirmed -> {
                titre = "📅 Rendez-vous confirmé";
                message = "Votre rendez-vous n°" + rdv.getId() + " a été confirmé.";
            }

            case cancelled -> {
                titre = "❌ Rendez-vous annulé";
                message = "Votre rendez-vous n°" + rdv.getId() + " a été annulé.";
            }

            case completed -> {
                titre = "✅ Rendez-vous terminé";
                message = "Votre rendez-vous n°" + rdv.getId() + " est terminé.";
            }

            default -> {
                titre = "📌 Mise à jour du rendez-vous";
                message = "Le statut de votre rendez-vous n°" + rdv.getId() + " a été mis à jour.";
            }
        }

        // =========================
        // NOTIFICATION CITOYEN
        // =========================
        if (rdv.getCitizen() != null) {

            notificationService.notifyUser(
                    rdv.getCitizen(),
                    titre,
                    message,
                    NotificationType.RENDEZ_VOUS
            );
        }

        // =========================
        // NOTIFICATION AGENT
        // =========================
        notificationService.notifyRole(
                "AGENT",

                "📅 Mise à jour rendez-vous",

                "Le rendez-vous n°" + rdv.getId()
                        + " du citoyen "
                        + rdv.getCitizen().getName()
                        + " est passé au statut : "
                        + nouveauStatut.name(),

                NotificationType.RENDEZ_VOUS
        );

        return rdv;
    }

    public Appointment getAppointmentById(Long id) {
        return repo.findAppointementByid(id);
    }
    public List<AppointmentRequest> getUpcomingAppointments(Long citizenId) {

        // FIX 1 — récupérer tous les RDV actifs du citoyen (pas seulement aujourd'hui)
        List<Appointment> citizenAppointments = repo.findUpcomingByCitizen(citizenId);

        return citizenAppointments.stream()
                .filter(a ->
                        a.getAgent() != null &&
                                a.getStartDateTime() != null &&
                                a.getStatus() != null &&
                                !a.getStatus().equalsIgnoreCase("CANCELLED") &&
                                !a.getStatus().equalsIgnoreCase("COMPLETED")
                )
                .map(appointment -> {

                    // FIX 2 — inclure IN_PROGRESS dans la file d'attente
                    List<Appointment> sameDayAppointments =
                            repo.findByDateAndAgentOrderByTimeAsc(
                                            appointment.getDate(),
                                            appointment.getAgent().getId()
                                    ).stream()
                                    .filter(a ->
                                                    a.getStartDateTime() != null &&
                                                            a.getStatus() != null &&
                                                            !a.getStatus().equalsIgnoreCase("CANCELLED") &&
                                                            !a.getStatus().equalsIgnoreCase("COMPLETED")
                                            // IN_PROGRESS est gardé ici volontairement
                                    )
                                    .sorted(Comparator.comparing(Appointment::getStartDateTime))
                                    .toList();

                    // =========================
                    // POSITION DANS LA FILE
                    // =========================
                    int queuePosition = 1;
                    for (Appointment a : sameDayAppointments) {
                        if (a.getStartDateTime().isBefore(appointment.getStartDateTime())) {
                            queuePosition++;
                        }
                    }
                    int peopleAhead = Math.max(0, queuePosition - 1);

                    // =========================
                    // URGENCE
                    // =========================
                    String urgency = "normal";
                    if (appointment.getStartDateTime() != null) {
                        long diffMinutes = java.time.Duration.between(
                                java.time.LocalDateTime.now(),
                                appointment.getStartDateTime()
                        ).toMinutes();

                        if (diffMinutes <= 15 && diffMinutes >= 0) {
                            urgency = "urgent";
                        } else if (diffMinutes <= 30 && diffMinutes >= 0) {
                            urgency = "soon";
                        }
                    }

                    // =========================
                    // DTO
                    // =========================
                    AppointmentRequest dto = new AppointmentRequest();

                    dto.setId(appointment.getId());

                    // FIX 3 — exposer le ticket sous les deux noms pour le frontend
                    dto.setTicket(appointment.getTicket());
                    dto.setTicket(appointment.getTicket());   // frontend lit ticketNumber
                    dto.setCitizenNumber(appointment.getTicket());  // frontend lit citizenNumber

                    if (appointment.getCitizen() != null) {
                        dto.setCitizenId(appointment.getCitizen().getId());
                        dto.setCitizenName(appointment.getCitizen().getName());
                    }

                    if (appointment.getDepartment() != null) {
                        dto.setServiceName(appointment.getDepartment().getName());
                    }

                    if (appointment.getAgent() != null) {
                        dto.setLocation(appointment.getAgent().getLocation() != null
                                ? appointment.getAgent().getLocation()
                                : "Agence municipale");
                    }

                    dto.setDate(appointment.getDate());
                    dto.setTime(
                            appointment.getStartDateTime()
                                    .toLocalTime()
                                    .toString()
                                    .substring(0, 5)
                    );
                    dto.setStatus(appointment.getStatus().toLowerCase());
                    dto.setStartDateTime(appointment.getStartDateTime());
                    dto.setEndDateTime(appointment.getEndDateTime());

                    // =========================
                    // FILE D'ATTENTE
                    // FIX 4 — queuePosition ET queueNumber remplis tous les deux
                    // =========================
                    dto.setQueueNumber(queuePosition);
                    dto.setQueuePosition(queuePosition);  // frontend lit queuePosition
                    dto.setPeopleAhead(peopleAhead);
                    dto.setUrgency(urgency);

                    // diffMinutes pour le compte à rebours
                    if (appointment.getStartDateTime() != null) {
                        long diff = java.time.Duration.between(
                                java.time.LocalDateTime.now(),
                                appointment.getStartDateTime()
                        ).toMinutes();
                        dto.setDiffMinutes(diff > 0 ? (int) diff : 0);
                    }

                    return dto;
                })
                .toList();
    }
}