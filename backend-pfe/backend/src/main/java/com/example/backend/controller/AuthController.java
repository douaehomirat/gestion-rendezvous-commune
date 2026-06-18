package com.example.backend.controller;

import com.example.backend.dto.ApiResponse;
import com.example.backend.dto.ForgotPasswordRequest;
import com.example.backend.dto.LoginResponse;
import com.example.backend.dto.ResetPasswordRequest;
import com.example.backend.entity.User;
import com.example.backend.exeption.EmailException;
import com.example.backend.exeption.InvalidTokenException;
import com.example.backend.exeption.UserNotFoundException;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:3000","https://gestion-rendezvous-commune-production-b126.up.railway.app","https://incredible-tapioca-00c427.netlify.app", "http://localhost:5173"})  // ✅ AJOUTÉ 3000
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository repo;

    @Autowired
    private PasswordEncoder passwordEncoder;
@Autowired
private AuthService authService;
    // 🔐 REGISTER
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {

        if (repo.existsByEmail(user.getEmail())) {
            return ResponseEntity.badRequest()
                    .body("Email déjà utilisé");
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setCreatedAt(LocalDateTime.now());


        repo.save(user);

        return ResponseEntity.ok("Compte créé");
    }

    // 🔐 LOGIN
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User request) {

        User user = repo.findByEmail(request.getEmail())
                .orElse(null);

        if (user == null) {
            return ResponseEntity.badRequest()
                    .body("Utilisateur introuvable");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return ResponseEntity.badRequest()
                    .body("Mot de passe incorrect");
        }

        // 🚀 SAFE RESPONSE
        LoginResponse res = new LoginResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole()
        );

        return ResponseEntity.ok(res);
    }
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request  // ✅ CORRIGÉ
    ) {
        try {
            authService.forgotPassword(request.getEmail());
            return ResponseEntity.ok(
                    new ApiResponse(true, "✅ Email envoyé ! Vérifiez votre boîte.")
            );
        } catch (UserNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse(false, "❌ Aucun compte avec cet email"));
        } catch (EmailException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, "❌ Erreur envoi email"));
        }
    }

    // ✅ RESET PASSWORD
 @PostMapping("/reset-password/{token}")
public ResponseEntity<ApiResponse> resetPassword(
        @PathVariable String token,
        @Valid @RequestBody ResetPasswordRequest request
) {
    try {
        if (!request.isPasswordMatch()) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "❌ Les mots de passe ne correspondent pas"));
        }

        authService.resetPassword(token, request.getPassword());

        return ResponseEntity.ok(
                new ApiResponse(true, "✅ Mot de passe réinitialisé avec succès!")
        );

    } catch (InvalidTokenException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse(false, "❌ Token invalide ou expiré"));

    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse(false, "❌ Erreur serveur"));
    }
}
}