package com.allstak.modules.teams.controller;

import com.allstak.shared.utils.ApiResponse;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.ZoneId;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/org")
@NullMarked
public class OrgSettingsController {

    private static final Logger log = LoggerFactory.getLogger(OrgSettingsController.class);

    private final JdbcClient jdbc;

    public OrgSettingsController(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping("/settings")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSettings(@RequestParam UUID orgId) {
        var result = jdbc.sql("""
                SELECT name, slug, plan, timezone, allowed_email_domains
                FROM organizations WHERE id = :orgId
                """)
                .param("orgId", orgId)
                .query((rs, rowNum) -> Map.of(
                        "name", rs.getString("name"),
                        "slug", rs.getString("slug"),
                        "plan", rs.getString("plan"),
                        "timezone", rs.getString("timezone"),
                        "allowedEmailDomains", rs.getArray("allowed_email_domains") != null
                                ? rs.getArray("allowed_email_domains").getArray() : new String[]{}
                ))
                .optional()
                .orElseThrow(() -> new RuntimeException("Organization not found"));

        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PatchMapping("/settings")
    @SuppressWarnings("unchecked")
    public ResponseEntity updateSettings(@RequestBody Map<String, Object> body) {
        UUID orgId = UUID.fromString((String) body.get("orgId"));

        if (body.containsKey("name")) {
            jdbc.sql("UPDATE organizations SET name = :name WHERE id = :orgId")
                    .param("name", body.get("name")).param("orgId", orgId).update();
        }
        if (body.containsKey("slug")) {
            String slug = (String) body.get("slug");
            if (!slug.matches("[a-z0-9-]+")) {
                return ResponseEntity.unprocessableEntity()
                        .body(ApiResponse.error("VALIDATION_ERROR", "Invalid slug format", null));
            }
            jdbc.sql("UPDATE organizations SET slug = :slug WHERE id = :orgId")
                    .param("slug", slug).param("orgId", orgId).update();
        }
        if (body.containsKey("timezone")) {
            String tz = (String) body.get("timezone");
            try { ZoneId.of(tz); } catch (Exception e) {
                return ResponseEntity.unprocessableEntity()
                        .body(ApiResponse.error("VALIDATION_ERROR", "Invalid timezone: " + tz, null));
            }
            jdbc.sql("UPDATE organizations SET timezone = :tz WHERE id = :orgId")
                    .param("tz", tz).param("orgId", orgId).update();
        }

        return ResponseEntity.ok(ApiResponse.ok(Map.of("status", "updated")));
    }

    @PostMapping("/export")
    public ResponseEntity<ApiResponse<Map<String, Object>>> exportData(@RequestBody Map<String, String> body) {
        UUID orgId = UUID.fromString(body.get("orgId"));
        // Async export — in production this would queue a background job
        String exportId = UUID.randomUUID().toString();
        log.info("GDPR export requested for org {} — exportId: {}", orgId, exportId);

        return ResponseEntity.accepted().body(ApiResponse.ok(Map.of(
                "exportId", exportId,
                "status", "queued",
                "estimatedMinutes", 5
        )));
    }

    @DeleteMapping("")
    @SuppressWarnings("unchecked")
    public ResponseEntity deleteOrg(@RequestBody Map<String, String> body) {
        UUID orgId = UUID.fromString(body.get("orgId"));
        String confirm = body.getOrDefault("confirm", "");

        // Get org slug for confirmation check
        String slug = jdbc.sql("SELECT slug FROM organizations WHERE id = :orgId")
                .param("orgId", orgId)
                .query((rs, rowNum) -> rs.getString("slug"))
                .optional()
                .orElseThrow(() -> new RuntimeException("Organization not found"));

        String expected = "delete " + slug;
        if (!expected.equals(confirm)) {
            return ResponseEntity.unprocessableEntity()
                    .body(ApiResponse.error("VALIDATION_ERROR",
                            "Confirmation required: type 'delete " + slug + "'", null));
        }

        // Soft delete
        jdbc.sql("UPDATE organizations SET deleted_at = NOW() WHERE id = :orgId")
                .param("orgId", orgId).update();

        log.warn("Organization {} ({}) soft-deleted — hard delete in 24h", orgId, slug);

        return ResponseEntity.ok(ApiResponse.ok(Map.of("status", "deleted", "message",
                "Organization scheduled for permanent deletion in 24 hours")));
    }
}
