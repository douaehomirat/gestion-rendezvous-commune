package com.example.backend.service;

import com.example.backend.entity.PasswordResetToken;
import com.example.backend.entity.User;
import com.example.backend.exeption.InvalidTokenException;
import com.example.backend.exeption.UserNotFoundException;
import com.example.backend.repository.PasswordResetTokenRepository;
import com.example.backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JavaMailSender mailSender;

    // ================= FORGOT PASSWORD =================
    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("Aucun compte avec cet email"));

        // Supprimer ancien token
        tokenRepository.deleteByUser(user);

        // Créer nouveau token
        String token = UUID.randomUUID().toString();
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken(token);
        resetToken.setUser(user);
        resetToken.setExpiryDate(LocalDateTime.now().plusMinutes(30));
        tokenRepository.save(resetToken);

        // Envoyer email via Brevo
        sendResetPasswordEmail(user, token);
    }

    // ================= RESET PASSWORD =================
    public void resetPassword(String token, String password) {
        PasswordResetToken resetToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new InvalidTokenException("Token invalide"));

        if (resetToken.isExpired()) {
            tokenRepository.delete(resetToken);
            throw new InvalidTokenException("Token expiré");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(password));
        userRepository.save(user);

        tokenRepository.delete(resetToken);
    }

    // ================= SEND EMAIL VIA BREVO =================
    private void sendResetPasswordEmail(User user, String token) {
        String resetUrl = "https://incredible-tapioca-00c427.netlify.app/reset-password?token=" + token;

        String body = """
                Bonjour %s,

                Vous avez demandé une réinitialisation de mot de passe.
                Cliquez sur le lien ci-dessous :

                %s

                ⚠️ Ce lien expire dans 30 minutes.

                Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.

                Cordialement,
                CityAppointment Team
                """.formatted(user.getName(), resetUrl);

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(user.getEmail());
        message.setSubject("Réinitialisation de votre mot de passe");
        message.setText(body);

        try {
            mailSender.send(message);
        } catch (Exception e) {
            throw new RuntimeException("Erreur envoi email Brevo: " + e.getMessage());
        }
    }
}