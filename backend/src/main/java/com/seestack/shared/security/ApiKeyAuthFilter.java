package com.seestack.shared.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.jspecify.annotations.NullMarked;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Validates the X-SeeStack-Key header on /ingest/** endpoints.
 * Sets the resolved project_id as a request attribute for downstream use.
 */
@Component
@NullMarked
public class ApiKeyAuthFilter extends OncePerRequestFilter {

    public static final String PROJECT_ID_ATTRIBUTE = "seestack.projectId";
    public static final String API_KEY_HEADER = "X-SeeStack-Key";

    private final ApiKeyService apiKeyService;
    private final ObjectMapper objectMapper;

    public ApiKeyAuthFilter(ApiKeyService apiKeyService, ObjectMapper objectMapper) {
        this.apiKeyService = apiKeyService;
        this.objectMapper = objectMapper;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith("/ingest/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String rawKey = request.getHeader(API_KEY_HEADER);
        Optional<UUID> projectId = apiKeyService.validateAndGetProjectId(rawKey);

        if (projectId.isEmpty()) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            Map<String, Object> body = Map.of(
                    "success", false,
                    "error", Map.of(
                            "code", "INVALID_API_KEY",
                            "message", "Invalid or missing API key"
                    )
            );
            objectMapper.writeValue(response.getWriter(), body);
            return;
        }

        request.setAttribute(PROJECT_ID_ATTRIBUTE, projectId.get());
        filterChain.doFilter(request, response);
    }
}
