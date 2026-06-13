package com.example.backend.service;

import com.example.backend.entity.PasswordResetToken;
import com.example.backend.entity.User;
import com.example.backend.exeption.InvalidTokenException;
import com.example.backend.exeption.UserNotFoundException;
import com.example.backend.repository.PasswordResetTokenRepository;
import com.example.backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Service
@Transactional
public class AuthService {

    @Autowired private UserRepository userRepository;
    @Autowired private PasswordResetTokenRepository tokenRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    @Value("${resend.api.key}")
    private String resendApiKey;

    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        tokenRepository.deleteByUser(user);

        String token = UUID.randomUUID().toString();
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken(token);
        resetToken.setUser(user);
        resetToken.setExpiryDate(LocalDateTime.now().plusHours(24));
        tokenRepository.save(resetToken);

        sendResetPasswordEmail(user, token);
    }

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
        String resetUrl = "https://incredible-tapioca-00c427.netlify.app/reset-password/" + token;

        String body = """
            Bonjour %s,
            
            Vous avez demandé une réinitialisation de mot de passe.
            Cliquez sur le lien ci-dessous :
            
            %s
            
            ⚠️ Ce lien expire dans 24 heures.
            
            Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.
            
            Cordialement,
            CityAppointment Team
            """.formatted(user.getName(), resetUrl);

        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(resendApiKey);

        Map<String, Object> payload = Map.of(
            "from", "onboarding@resend.dev",
            "to", new String[]{"douae.homirat@uit.ac.ma"},
            "subject", "🔒 Réinitialisation de votre mot de passe",
            "text", body
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);
        restTemplate.postForObject("https://api.resend.com/emails", request, String.class);
    }
}