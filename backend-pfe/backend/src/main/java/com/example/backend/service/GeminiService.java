package com.example.backend.service;

import com.example.backend.entity.Appointment;
import com.example.backend.entity.Department;
import com.example.backend.repository.AppointmentRepository;
import com.example.backend.repository.DepartmentRepository;
import jakarta.annotation.PostConstruct;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class GeminiService {

    @Value("${GEMINI_API_KEY:NON_DEFINIE}")
    private String apiKey;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private AppointmentService appointmentService;

    @PostConstruct
    public void init() {
        System.out.println(">>> GEMINI_API_KEY présente : " + !apiKey.equals("NON_DEFINIE"));
    }

    // =========================================================
    // Construit le contexte depuis la DB (départements + slots)
    // =========================================================
    private String buildContext(String userMessage) {
        StringBuilder ctx = new StringBuilder();

        // --- Départements ---
        List<Department> departments = departmentRepository.findAll();
        ctx.append("=== DÉPARTEMENTS DISPONIBLES ===\n");
        for (Department d : departments) {
            ctx.append("- ID:").append(d.getId())
               .append(" | Nom: ").append(d.getName());
            if (d.getDescription() != null && !d.getDescription().isBlank()) {
                ctx.append(" | Description: ").append(d.getDescription());
            }
            ctx.append("\n");
        }

        // --- Créneaux disponibles pour aujourd'hui et demain ---
        LocalDate today = LocalDate.now();
        LocalDate tomorrow = today.plusDays(1);

        ctx.append("\n=== CRÉNEAUX DISPONIBLES ===\n");
        for (Department d : departments) {
            ctx.append("\nDépartement: ").append(d.getName()).append("\n");

            for (LocalDate date : List.of(today, tomorrow)) {
                List<Map<String, Object>> slots = appointmentService.getAutoSlots(d.getId(), date);
                long availableCount = slots.stream()
                        .filter(s -> ((Number) s.get("availableAgents")).longValue() > 0)
                        .count();

                ctx.append("  ").append(date).append(" — ")
                   .append(availableCount).append(" créneau(x) disponible(s)\n");

                slots.stream()
                     .filter(s -> ((Number) s.get("availableAgents")).longValue() > 0)
                     .limit(8)
                     .forEach(s -> ctx.append("    • ").append(s.get("time"))
                             .append(" (").append(s.get("availableAgents")).append(" agent(s))\n"));
            }
        }

        // --- Derniers RDV (contexte général) ---
        List<Appointment> recent = appointmentRepository.findTop5ByOrderByDateDesc();
        ctx.append("\n=== DERNIERS RENDEZ-VOUS (contexte) ===\n");
        for (Appointment a : recent) {
            ctx.append("- RDV #").append(a.getId())
               .append(" | Date: ").append(a.getDate())
               .append(" | Heure: ").append(a.getTime())
               .append(" | Département: ").append(a.getDepartment() != null ? a.getDepartment().getName() : "N/A")
               .append(" | Statut: ").append(a.getStatus())
               .append("\n");
        }

        return ctx.toString();
    }

    // =========================================================
    // Point d'entrée principal
    // =========================================================
    public String askGemini(String userMessage) {
        try {
            if (apiKey.equals("NON_DEFINIE") || apiKey.isBlank()) {
                return "Erreur de configuration : GEMINI_API_KEY non définie.";
            }

            String dbContext = buildContext(userMessage);

            String prompt = """
                    Tu es un assistant virtuel de la commune, spécialisé dans les rendez-vous administratifs.

                    Règles strictes :
                    - Réponds UNIQUEMENT en français.
                    - Base tes réponses sur les données réelles ci-dessous.
                    - Si le citoyen demande les créneaux disponibles, liste-les clairement.
                    - Si le citoyen veut prendre un RDV, indique-lui les créneaux disponibles du département concerné.
                    - Si aucun créneau n'est disponible, dis-le clairement et suggère un autre jour.
                    - Ne jamais inventer de données absentes du contexte.
                    - Sois concis, clair et poli.

                    """
                    + dbContext
                    + "\n=== QUESTION DU CITOYEN ===\n"
                    + userMessage;

            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key="+ apiKey;

            JSONObject body = new JSONObject();
            JSONArray contents = new JSONArray();
            JSONObject content = new JSONObject();
            JSONArray parts = new JSONArray();

            parts.put(new JSONObject().put("text", prompt));
            content.put("parts", parts);
            contents.put(content);
            body.put("contents", contents);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> entity = new HttpEntity<>(body.toString(), headers);

            RestTemplate restTemplate = new RestTemplate();
            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.POST, entity, String.class
            );

            JSONObject jsonResponse = new JSONObject(response.getBody());
            return jsonResponse
                    .getJSONArray("candidates")
                    .getJSONObject(0)
                    .getJSONObject("content")
                    .getJSONArray("parts")
                    .getJSONObject(0)
                    .getString("text");

        } catch (HttpClientErrorException e) {
            System.err.println(">>> Gemini HTTP Error: " + e.getStatusCode() + " — " + e.getResponseBodyAsString());
            return "Erreur API Gemini [" + e.getStatusCode() + "] : " + e.getResponseBodyAsString();
        } catch (Exception e) {
            System.err.println(">>> Gemini Exception: " + e.getClass().getSimpleName() + " — " + e.getMessage());
            return "Erreur : " + e.getClass().getSimpleName() + " — " + e.getMessage();
        }
    }
}