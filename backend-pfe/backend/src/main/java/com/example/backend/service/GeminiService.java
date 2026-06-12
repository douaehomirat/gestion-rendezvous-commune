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

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.time.format.TextStyle;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

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

    // =========================================================
    // Jours fériés marocains (fixes) — à compléter/adapter
    // =========================================================
    private static final Set<String> JOURS_FERIES = Set.of(
        "01-01", // Nouvel An
        "01-11", // Manifeste de l'Indépendance
        "05-01", // Fête du Travail
        "07-30", // Fête du Trône
        "08-14", // Allégeance Oued Ed-Dahab
        "08-20", // Révolution du Roi et du Peuple
        "08-21", // Fête de la Jeunesse
        "11-06", // Marche Verte
        "11-18"  // Fête de l'Indépendance
    );

    @PostConstruct
    public void init() {
        System.out.println(">>> GEMINI_API_KEY présente : " + !apiKey.equals("NON_DEFINIE"));
    }

    // =========================================================
    // Vérifie si une date est un jour non ouvrable
    // =========================================================
    private boolean isJourNonOuvrable(LocalDate date) {
        DayOfWeek day = date.getDayOfWeek();
        if (day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY) return true;
        String mmdd = String.format("%02d-%02d", date.getMonthValue(), date.getDayOfMonth());
        return JOURS_FERIES.contains(mmdd);
    }

    private String getNomJour(LocalDate date) {
        return date.getDayOfWeek().getDisplayName(TextStyle.FULL, Locale.FRENCH);
    }

    // =========================================================
    // Construit le contexte depuis la DB (départements + slots)
    // =========================================================
    private String buildContext(String userMessage) {
        StringBuilder ctx = new StringBuilder();

        List<Department> departments = departmentRepository.findAll();

        // --- Départements (sans ID) ---
        ctx.append("=== DÉPARTEMENTS DISPONIBLES ===\n");
        for (Department d : departments) {
            ctx.append("- ").append(d.getName());
            if (d.getDescription() != null && !d.getDescription().isBlank()) {
                ctx.append(" : ").append(d.getDescription());
            }
            ctx.append("\n");
        }

        // --- Créneaux disponibles pour aujourd'hui et demain ---
        LocalDate today = LocalDate.now();
        LocalDate tomorrow = today.plusDays(1);

        ctx.append("\n=== CRÉNEAUX DISPONIBLES ===\n");
        ctx.append("(Les rendez-vous ne sont possibles que du lundi au vendredi, hors jours fériés.)\n");

        for (Department d : departments) {
            ctx.append("\nDépartement : ").append(d.getName()).append("\n");

            for (LocalDate date : List.of(today, tomorrow)) {
                String nomJour = getNomJour(date);
                if (isJourNonOuvrable(date)) {
                    ctx.append("  ").append(date).append(" (").append(nomJour)
                       .append(") — Fermé (weekend ou jour férié)\n");
                    continue;
                }

                List<Map<String, Object>> slots = appointmentService.getAutoSlots(d.getId(), date);
                List<Map<String, Object>> available = slots.stream()
                        .filter(s -> ((Number) s.get("availableAgents")).longValue() > 0)
                        .toList();

                ctx.append("  ").append(date).append(" (").append(nomJour).append(") — ")
                   .append(available.size()).append(" créneau(x) disponible(s)\n");

                available.stream()
                         .limit(8)
                         .forEach(s -> ctx.append("    • ").append(s.get("time")).append("\n"));
            }
        }

        // --- Derniers RDV (contexte général, sans agent count) ---
        List<Appointment> recent = appointmentRepository.findTop5ByOrderByDateDesc();
        ctx.append("\n=== DERNIERS RENDEZ-VOUS (contexte) ===\n");
        for (Appointment a : recent) {
            ctx.append("- Date: ").append(a.getDate())
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
                    Tu es CiviBot, l'assistant virtuel intelligent de la commune, spécialisé dans les rendez-vous administratifs.

                    Règles strictes :
                    - Réponds UNIQUEMENT en français.
                    - Base tes réponses exclusivement sur les données réelles ci-dessous.
                    - Ne jamais mentionner les identifiants (ID) des départements ni le nombre d'agents disponibles.
                    - Si le citoyen demande les créneaux disponibles, liste-les clairement sous forme de liste avec les horaires uniquement.
                    - Si le citoyen veut prendre un RDV, indique les créneaux disponibles du département concerné.
                    - Si aucun créneau n'est disponible, dis-le clairement et suggère un autre jour ouvrable.
                    - Si le citoyen demande un rendez-vous pour un weekend ou un jour férié, réponds clairement :
                      "Les rendez-vous ne sont pas disponibles le weekend ni les jours fériés. Nos services sont ouverts du lundi au vendredi."
                      Puis propose les prochains créneaux disponibles un jour ouvrable.
                    - Ne jamais inventer de données absentes du contexte.
                    - Sois concis, clair et poli.
                    - Formate les créneaux disponibles sous forme de liste à puces propre, sans mentionner le nombre d'agents.

                    """
                    + dbContext
                    + "\n=== QUESTION DU CITOYEN ===\n"
                    + userMessage;

            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey;

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