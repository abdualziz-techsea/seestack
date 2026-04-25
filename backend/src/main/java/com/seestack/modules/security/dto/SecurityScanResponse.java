package com.seestack.modules.security.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.seestack.modules.security.entity.SecurityScanEntity;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;

import java.time.Instant;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@NullMarked
public record SecurityScanResponse(
        UUID id,
        @Nullable UUID projectId,
        String target,
        @Nullable String resolvedHost,
        List<Integer> scannedPorts,
        List<Integer> openPorts,
        List<Integer> closedPorts,
        Map<String, String> detectedServices,
        Map<String, Object> httpInfo,
        Map<String, Boolean> securityHeaders,
        int riskScore,
        String riskLevel,
        @Nullable String summary,
        String status,
        @Nullable String errorMessage,
        String scanType,
        Instant createdAt,
        @Nullable Instant completedAt
) {
    public static SecurityScanResponse from(SecurityScanEntity e, ObjectMapper objectMapper) {
        return new SecurityScanResponse(
                e.getId(),
                e.getProjectId(),
                e.getTarget(),
                e.getResolvedHost(),
                parsePorts(e.getScannedPorts()),
                parsePorts(e.getOpenPorts()),
                parsePorts(e.getClosedPorts()),
                readMap(objectMapper, e.getDetectedServices(), String.class),
                readMap(objectMapper, e.getHttpInfo(), Object.class),
                readMap(objectMapper, e.getSecurityHeaders(), Boolean.class),
                e.getRiskScore(),
                e.getRiskLevel(),
                e.getSummary(),
                e.getStatus(),
                e.getErrorMessage(),
                "Basic Security Analysis",
                e.getCreatedAt(),
                e.getCompletedAt()
        );
    }

    private static List<Integer> parsePorts(String csv) {
        if (csv == null || csv.isBlank()) return List.of();
        return Arrays.stream(csv.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(Integer::parseInt)
                .toList();
    }

    @SuppressWarnings("unchecked")
    private static <V> Map<String, V> readMap(ObjectMapper m, @Nullable String json, Class<V> valueType) {
        if (json == null || json.isBlank()) return new LinkedHashMap<>();
        try {
            return (Map<String, V>) m.readValue(json, Map.class);
        } catch (Exception e) {
            return new LinkedHashMap<>();
        }
    }
}
