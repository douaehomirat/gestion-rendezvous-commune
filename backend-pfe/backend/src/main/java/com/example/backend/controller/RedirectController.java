package com.example.backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class RedirectController {

    @GetMapping("/reset-password/{token}")
    public ResponseEntity<Void> redirectToFrontend(@PathVariable String token) {
        // Redirige vers frontend + token
        String frontendUrl = "https://incredible-tapioca-00c427.netlify.app/reset-password?token=" + token;
        return ResponseEntity.status(HttpStatus.FOUND)
                .header("Location", frontendUrl)
                .build();
    }
}
