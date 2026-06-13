package com.example.backend.service;

import com.example.backend.entity.PasswordResetToken;
import com.example.backend.entity.User;
import com.example.backend.exeption.InvalidTokenException;
import com.example.backend.exeption.UserNotFoundException;
import com.example.backend.repository.PasswordResetTokenRepository;
import com.example.backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;


@Service
@Transactional
public class AuthService {

    @Autowired private UserRepository userRepository;
    @Autowired private PasswordResetTokenRepository tokenRepository;
    @Autowired
    private JavaMailSender mailSender;
    @Autowired private PasswordEncoder passwordEncoder;

    // ✅ Forgot Password
    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        // Supprimer anciens tokens
        tokenRepository.deleteByUser(user);

        // Créer nouveau token
        String token = UUID.randomUUID().toString();
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken(token);
        resetToken.setUser(user);
        resetToken.setExpiryDate(LocalDateTime.now().plusHours(24)); // 24h
        tokenRepository.save(resetToken);

        // Envoyer email
        sendResetPasswordEmail(user, token);
    }

    // ✅ Reset Password
    public void resetPassword(String token, String password) {
        PasswordResetToken resetToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new InvalidTokenException("Invalid token"));

        if (resetToken.isExpired()) {
            throw new InvalidTokenException("Token expiré");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(password));
        userRepository.save(user);

        tokenRepository.delete(resetToken);
    }

    private void sendResetPasswordEmail(User user, String token) {
        String resetUrl = "https://incredible-tapioca-00c427.netlify.app/reset-password/" + token;  // Backend
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(user.getEmail());
        message.setSubject("🔒 Réinitialisation de votre mot de passe");
        message.setText("""
            Bonjour %s,
            
            Vous avez demandé une réinitialisation de mot de passe.
            Cliquez sur le lien ci-dessous pour définir un nouveau mot de passe :
            
            %s
            
            ⚠️ Ce lien expire dans 24 heures.
            
            Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.
            
            Cordialement,
            CityAppointment Team
            """.formatted(user.getName(), resetUrl));

        mailSender.send(message);
    }
}
