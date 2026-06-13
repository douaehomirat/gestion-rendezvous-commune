package com.example.backend.service;

import com.example.backend.entity.Appointment;
import com.example.backend.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AppointmentReminderService {

    // Supprimer : private final JavaMailSender mailSender;
    private final AppointmentRepository appointmentRepository;

    @Value("${resend.api.key}")
    private String resendApiKey;

    private static final DateTimeFormatter FORMATTER =
            DateTimeFormatter.ofPattern("dd/MM/yyyy 'à' HH:mm");

    public void sendReminder(Long appointmentId) {

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() ->
                        new RuntimeException("Rendez-vous introuvable : " + appointmentId)
                );

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime apptDateTime = appointment.getStartDateTime();

        if (apptDateTime == null) {
            throw new RuntimeException("Date du rendez-vous invalide");
        }

        long hoursUntil = Duration.between(now, apptDateTime).toHours();

        if (hoursUntil < 0) {
            throw new RuntimeException("Le rendez-vous est déjà passé.");
        }

        if (hoursUntil > 24) {
            throw new RuntimeException("Le rendez-vous n'est pas dans les 24 heures.");
        }

        if (appointment.getCitizen() == null || appointment.getCitizen().getEmail() == null) {
            throw new RuntimeException("Email du citoyen introuvable");
        }

        String citizenEmail = appointment.getCitizen().getEmail();
        String citizenName = appointment.getCitizen().getName() != null
                ? appointment.getCitizen().getName()
                : "Citoyen";

        String serviceName = appointment.getServiceName() != null
                ? appointment.getServiceName()
                : "Service administratif";

        String dateStr = apptDateTime.format(FORMATTER);

        String body = "Bonjour " + citizenName + ",\n\n" +
                "Ceci est un rappel de votre rendez-vous :\n\n" +
                "📅 Date : " + dateStr + "\n" +
                "📌 Service : " + appointment.getDepartment().getName() + "\n\n" +
                "Merci de vous présenter à l'heure.\n\n" +
                "Cordialement,\nAdministration";

        sendEmail(citizenEmail, "Rappel : votre rendez-vous", body);
    }

    private void sendEmail(String to, String subject, String body) {
        RestTemplate restTemplate = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(resendApiKey);

        Map<String, Object> payload = Map.of(
                "from", "onboarding@resend.dev",
                "to", new String[]{to},
                "subject", subject,
                "text", body
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);
        restTemplate.postForObject("https://api.resend.com/emails", request, String.class);
    }
}