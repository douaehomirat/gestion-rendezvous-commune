package com.example.backend.controller;

import com.example.backend.dto.AppointmentCalendarDTO;
import com.example.backend.dto.AppointmentRequest;
import com.example.backend.dto.ReminderRequest;
import com.example.backend.entity.Appointment;
import com.example.backend.entity.Department;
import com.example.backend.entity.User;
import com.example.backend.enums.StatutRdv;
import com.example.backend.enums.StatutReclamation;
import com.example.backend.repository.AppointmentRepository;
import com.example.backend.repository.DepartmentRepository;
import com.example.backend.repository.UserRepository;

import com.example.backend.service.AppointmentReminderService;
import com.example.backend.service.AppointmentService;
import com.example.backend.service.EmailService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/appointments")
@CrossOrigin(origins = "https://incredible-tapioca-00c427.netlify.app")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final AppointmentService appointmentService;
    private final AppointmentReminderService appointmentReminderService;
    private final EmailService emailService;
    @GetMapping("/by-citizen")
    public List<AppointmentRequest> getByCitizenAndDateRange(
            @RequestParam Long citizenId,
            @RequestParam String from,
            @RequestParam String to
    ) {
        LocalDateTime start = LocalDate.parse(from).atStartOfDay();
        LocalDateTime end   = LocalDate.parse(to).atTime(23, 59, 59);
        return appointmentRepository
                .findByCitizenIdAndDateRange(citizenId, start, end)
                .stream()
                .map(appointmentService::toDTO)
                .toList();
    }

    @GetMapping("/check-weekly")
    public ResponseEntity<Map<String, Boolean>> checkWeekly(
            @RequestParam Long citizenId,
            @RequestParam Long departmentId,   // ← ajouter
            @RequestParam String from,
            @RequestParam String to
    ) {
        LocalDateTime start = LocalDate.parse(from).atStartOfDay();
        LocalDateTime end   = LocalDate.parse(to).atTime(23, 59, 59);

        boolean hasActive = appointmentRepository
                .existsActiveAppointmentThisWeekForDepartment(citizenId, departmentId, start, end);

        return ResponseEntity.ok(Map.of("hasActive", hasActive));
    }

    @GetMapping
    public List<AppointmentRequest> getAll() {
        return appointmentRepository.findAll()
                .stream()
                .map(appointmentService::toDTO)
                .toList();
    }

    @GetMapping("/calendar/agent/{agentId}")
    public List<Appointment> getCalendarByAgent(@PathVariable Long agentId) {
        return appointmentRepository.findByAgent_Id(agentId);
    }

    @GetMapping("/citizen/{id}")
    public List<AppointmentRequest> getByCitizen(@PathVariable Long id) {
        return appointmentService.getByCitizen(id);
    }

    @GetMapping("/agent/{id}")
    public List<Appointment> getByAgent(@PathVariable Long id) {
        return appointmentService.getAppointmentsByAgent(id);
    }

    @GetMapping("/debug/{id}")
    public List<Appointment> debug(@PathVariable Long id) {
        return appointmentRepository.findFullByCitizenId(id);
    }



    @GetMapping("/citizen/{id}/activity")
    public List<AppointmentRequest> getActivity(@PathVariable Long id) {
        return appointmentService.getByCitizen(id);
    }

    @GetMapping("/citizen/{id}/stats")
    public Map<String, Object> getStats(@PathVariable Long id) {
        List<AppointmentRequest> list = appointmentService.getByCitizen(id);
        long total     = list.size();
        long pending   = list.stream().filter(a -> "pending".equals(a.getStatus())).count();
        long confirmed = list.stream().filter(a -> "confirmed".equals(a.getStatus())).count();
        long completed = list.stream().filter(a -> "completed".equals(a.getStatus())).count();
        long cancelled = list.stream().filter(a -> "cancelled".equals(a.getStatus())).count();
        return Map.of(
                "total", total,
                "pending", pending,
                "confirmed", confirmed,
                "completed", completed,
                "cancelled", cancelled
        );
    }

    // ✅ CORRIGÉ : citizen, department, ticket, status, date, time maintenant sauvegardés
    @PostMapping
    @Transactional  // ← ajoute ceci
    public AppointmentRequest create(@RequestBody AppointmentRequest req) {

        LocalDateTime start = req.getStartDateTime();
        LocalDateTime end   = req.getEndDateTime();
        LocalDate date = req.getStartDateTime().toLocalDate();

        LocalDate startOfWeek = date.with(DayOfWeek.MONDAY);
        LocalDate endOfWeek = date.with(DayOfWeek.SUNDAY);

        LocalDateTime startWeek = startOfWeek.atStartOfDay();
        LocalDateTime endWeek = endOfWeek.atTime(23, 59, 59);

        boolean alreadyHasAppointment =
                appointmentRepository.existsActiveAppointmentThisWeekForDepartment(
                        req.getCitizenId(),
                        req.getDepartmentId(),
                        startWeek,
                        endWeek
                );

        if (alreadyHasAppointment) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Vous avez déjà un rendez-vous cette semaine"
            );
        }

        User agent = appointmentService.findBestAvailableAgent(
                req.getDepartmentId(), start, end
        );

        if (agent == null) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Aucun agent disponible pour ce créneau"
            );
        }

        // Double vérification APRÈS avoir trouvé l'agent
        boolean stillFree = !appointmentRepository.existsConflict(
                agent.getId(), start, end
        );

        if (!stillFree) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Créneau pris entre temps, veuillez réessayer"
            );
        }

        User citizen = userRepository.findById(req.getCitizenId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Citoyen introuvable"
                ));

        Department department = departmentRepository.findById(req.getDepartmentId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Département introuvable"
                ));

        Appointment a = new Appointment();
        a.setAgent(agent);
        a.setCitizen(citizen);
        a.setDepartment(department);
        a.setTicket(req.getTicket());
        a.setNotes(req.getNotes());
        a.setStatus("pending");
        a.setStartDateTime(start);
        a.setReminderSent(false);
        a.setEndDateTime(end);
        a.setDate(start.toLocalDate());
        a.setTime(start.toLocalTime().toString());

        Appointment saved = appointmentService.save(a);
        return appointmentService.toDTO(saved);
    }
    @PutMapping("/{id}")
    public AppointmentRequest update(
            @PathVariable Long id,
            @RequestBody AppointmentRequest request) {

        Appointment existing = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        existing.setNotes(request.getNotes());
        if (request.getStatus() != null) {
            existing.setStatus(request.getStatus());
        }
        existing.setDate(request.getDate());
        existing.setTime(request.getTime());
        existing.setStartDateTime(request.getStartDateTime());
        existing.setEndDateTime(request.getEndDateTime());

        return appointmentService.toDTO(appointmentRepository.save(existing));
    }

    @PutMapping("/{id}/cancel")
    public Appointment cancel(@PathVariable Long id) {
        return appointmentService.updateStatut(id, StatutRdv.cancelled);
    }

    @PutMapping("/{id}/confirm")
    public Appointment confirm(@PathVariable Long id) {
        return appointmentService.updateStatut(id, StatutRdv.confirmed);
    }

    @PutMapping("/{id}/complete")
    public Appointment complete(@PathVariable Long id) {
        return appointmentService.updateStatut(id, StatutRdv.completed);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        appointmentRepository.deleteById(id);
    }


    @PostMapping("/reminder")
    public ResponseEntity<?> sendReminder(@RequestBody ReminderRequest req) {

        appointmentService.sendReminderEmail(
                req.getEmail(),
                req.getName(),
                req.getDate(),
                req.getTime()
        );

        return ResponseEntity.ok("Email envoyé");
    }


    @PostMapping("/{id}/remind")
    public ResponseEntity<String> sendReminder(@PathVariable Long id) {
        appointmentReminderService.sendReminder(id);
        return ResponseEntity.ok("Email envoyé.");
    }


    @GetMapping("/recent")
    public List<Appointment> recentAppointments() {
        return appointmentRepository.findTop5ByOrderByDateDesc();
    }
    // =========================
    // MARK AS COMPLETED
    // =========================

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body
    ) {

        Appointment appointment = appointmentRepository
                .findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        String status = body.get("status");

        appointment.setStatus(status);

        appointmentRepository.save(appointment);

        return ResponseEntity.ok().body(
                Map.of(
                        "message", "Status updated",
                        "status", status
                )
        );
    }


    @PostMapping("/remind/batch")
    public ResponseEntity<?> sendAllReminders(@RequestParam Long agentId) {

        List<Appointment> appointments =
                appointmentRepository.findByAgent_Id(agentId);

        LocalDateTime now = LocalDateTime.now();
        int sentCount = 0;

        for (Appointment appt : appointments) {

            if (appt.getReminderSent()) continue;
            if ("completed".equals(appt.getStatus())) continue;

            LocalDateTime dateTime = appt.getStartDateTime();
            if (dateTime == null) continue;

            long hours = Duration.between(now, dateTime).toHours();

            // only < 24h and future
            if (hours > 0 && hours <= 24) {

                try {
                    // ✅ UTILISE TON VRAI SERVICE
                    appointmentReminderService.sendReminder(appt.getId());

                    appt.setReminderSent(true);
                    appointmentRepository.save(appt);

                    sentCount++;

                } catch (Exception e) {
                    System.out.println("❌ Erreur email appointment " + appt.getId());
                }
            }
        }

        return ResponseEntity.ok("Emails envoyés: " + sentCount);
    }
    @GetMapping("/{id}")
    public ResponseEntity<Appointment> getAppointmentById(
            @PathVariable Long id) {

        Appointment appointment = appointmentService.getAppointmentById(id);

        return ResponseEntity.ok(appointment);
    }
    @GetMapping("/citizen/{citizenId}/upcoming")
    public List<AppointmentRequest> getUpcomingAppointments(
            @PathVariable Long citizenId
    ) {
        return appointmentService.getUpcomingAppointments(
                citizenId
        );
    }
@GetMapping("/upcoming-reminders")
public List<Map<String, Object>> getUpcomingReminders() {

    LocalDateTime now = LocalDateTime.now();
    LocalDateTime limitDate = now.plusHours(24);

    System.out.println("===== REMINDER CHECK =====");
    System.out.println("NOW = " + now);
    System.out.println("LIMIT DATE = " + limitDate);

    var appointments = appointmentRepository.findAppointmentsForReminder(limitDate);

    System.out.println("FOUND APPOINTMENTS = " + appointments.size());

    return appointments.stream()
            .map(a -> Map.<String, Object>of(
                    "id", a.getId(),
                    "citizenName", a.getCitizen() != null ? a.getCitizen().getName() : "",
                    "citizenEmail", a.getCitizen() != null ? a.getCitizen().getEmail() : "",
                    "serviceName", a.getDepartment() != null ? a.getDepartment().getName() : "",
                    "appointmentDate", a.getDate(),
                    "appointmentTime", a.getTime(),
                    "appointmentReminderSent", a.isReminderSent()
            ))
            .toList();
}
@PutMapping("/{id}/mark-reminded")
public ResponseEntity<?> markReminded(
        @PathVariable Long id
) {
    Appointment appt =
            appointmentRepository.findById(id)
                    .orElseThrow();

    appt.setReminderSent(true);

    appointmentRepository.save(appt);

    return ResponseEntity.ok().build();
}
}