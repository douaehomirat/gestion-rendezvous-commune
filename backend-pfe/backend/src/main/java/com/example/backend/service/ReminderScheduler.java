package com.example.backend.service;

import com.example.backend.entity.Appointment;
import com.example.backend.repository.AppointmentRepository;
import com.example.backend.service.AppointmentService;
import com.example.backend.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ReminderScheduler {

    private static final Logger log = LoggerFactory.getLogger(ReminderScheduler.class);

    private final AppointmentRepository repository;
    private final EmailService emailService;

    public ReminderScheduler(AppointmentRepository repository,
                             EmailService emailService) {
        this.repository = repository;
        this.emailService = emailService;
    }

    // 🔥 every hour
    public void sendReminders() {

        System.out.println("⏰ CHECKING REMINDERS...");

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime limit = now.plusHours(24);

        List<Appointment> list = repository.findAppointmentsForReminder(now, limit);

        for (Appointment a : list) {

            if (a.getCitizen() == null) continue;

            try {
                emailService.sendEmail(
                        a.getCitizen().getEmail(),
                        "📅 Rappel de rendez-vous",
                        "Bonjour " + a.getCitizen().getName() +
                                "\n\nVotre rendez-vous est prévu le " +
                                a.getStartDateTime() +
                                "\n\nMerci de vous présenter à l'heure."
                );
            } catch (Exception e) {
                log.error("Failed to send reminder email to {}: {}", a.getCitizen().getEmail(), e.getMessage());
                continue;
            }

            a.setReminderSent(true);
            repository.save(a);
        }

        System.out.println("✅ REMINDERS DONE: " + list.size());
    }
}
