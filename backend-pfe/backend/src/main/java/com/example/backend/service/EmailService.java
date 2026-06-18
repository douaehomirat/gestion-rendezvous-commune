package com.example.backend.service;

import com.example.backend.entity.Appointment;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    public void sendResetLink(String toEmail, String token) {
        String resetUrl = frontendUrl + "/reset-password?token=" + token;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Réinitialisation de votre mot de passe");
        message.setText(
            "Bonjour,\n\n" +
            "Cliquez sur ce lien pour réinitialiser votre mot de passe :\n\n" +
            resetUrl + "\n\n" +
            "Ce lien expire dans 30 minutes.\n\n" +
            "Si vous n'avez pas demandé cette réinitialisation, ignorez cet email."
        );

        mailSender.send(message);
    }
    public void sendEmail(String to, String subject, String body) {
    SimpleMailMessage message = new SimpleMailMessage();
    message.setTo(to);
    message.setSubject(subject);
    message.setText(body);

    try {
        mailSender.send(message);
    } catch (Exception e) {
        throw new RuntimeException("Erreur envoi email: " + e.getMessage());
    }
}
}