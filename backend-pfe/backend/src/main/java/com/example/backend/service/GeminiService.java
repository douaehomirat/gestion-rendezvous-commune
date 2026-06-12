package com.example.backend.service;

import com.example.backend.dto.ChatResponse;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class GeminiService {

    @Value("${GEMINI_API_KEY}")
    private String apiKey;

    public String askGemini(String userMessage) {

        try {

            String prompt = """
                    Tu es un assistant virtuel spécialisé dans les rendez-vous administratifs.

                    Tes missions :
                    - Informer sur les démarches administratives.
                    - Expliquer les documents nécessaires.
                    - Aider à prendre un rendez-vous.
                    - Aider à modifier ou annuler un rendez-vous.
                    - Répondre uniquement en français.

                    Question :
                    """ + userMessage;

            String url =
                    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key="
                            + apiKey;

            JSONObject body = new JSONObject();

            JSONArray contents = new JSONArray();

            JSONObject content = new JSONObject();

            JSONArray parts = new JSONArray();

            parts.put(
                    new JSONObject()
                            .put("text", prompt)
            );

            content.put("parts", parts);

            contents.put(content);

            body.put("contents", contents);

            HttpHeaders headers = new HttpHeaders();

            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<String> entity =
                    new HttpEntity<>(body.toString(), headers);

            RestTemplate restTemplate = new RestTemplate();

            ResponseEntity<String> response =
                    restTemplate.exchange(
                            url,
                            HttpMethod.POST,
                            entity,
                            String.class
                    );

            JSONObject jsonResponse =
                    new JSONObject(response.getBody());

            return jsonResponse
                    .getJSONArray("candidates")
                    .getJSONObject(0)
                    .getJSONObject("content")
                    .getJSONArray("parts")
                    .getJSONObject(0)
                    .getString("text");

        } catch (Exception e) {
            return "Erreur lors de la communication avec Gemini.";
        }
    }
}