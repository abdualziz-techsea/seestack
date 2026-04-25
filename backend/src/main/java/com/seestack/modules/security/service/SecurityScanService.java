package com.seestack.modules.security.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.seestack.modules.security.entity.SecurityScanEntity;
import com.seestack.modules.security.repository.SecurityScanRepository;
import com.seestack.shared.exception.EntityNotFoundException;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@NullMarked
public class SecurityScanService {

    private final SecurityScanRepository repository;
    private final PortScanner portScanner;
    private final SecurityAnalyzer analyzer;
    private final ObjectMapper objectMapper;

    public SecurityScanService(SecurityScanRepository repository, PortScanner portScanner,
                               SecurityAnalyzer analyzer, ObjectMapper objectMapper) {
        this.repository = repository;
        this.portScanner = portScanner;
        this.analyzer = analyzer;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public SecurityScanEntity createAndRun(String target, @Nullable UUID projectId) {
        String scannedPorts = PortScanner.COMMON_PORTS.stream()
                .map(String::valueOf)
                .collect(Collectors.joining(","));

        SecurityScanEntity entity = new SecurityScanEntity(projectId, target, scannedPorts);
        entity = repository.save(entity);

        PortScanner.ScanResult result = portScanner.scan(target);
        if (result.success()) {
            entity.complete(
                    result.resolvedHost(),
                    joinPorts(result.openPorts()),
                    joinPorts(result.closedPorts())
            );

            // Smart analysis layer: services + HTTP probe + headers + risk score
            try {
                String host = result.resolvedHost().isBlank() ? target : target;
                SecurityAnalyzer.Result a = analyzer.analyze(host, result.openPorts());

                Map<String, Object> httpInfoJson = new LinkedHashMap<>();
                if (a.httpProbe() != null) {
                    httpInfoJson.put("url", a.httpProbe().url());
                    httpInfoJson.put("statusCode", a.httpProbe().statusCode());
                    httpInfoJson.put("responseTimeMs", a.httpProbe().responseTimeMs());
                    httpInfoJson.put("server", a.httpProbe().server());
                    httpInfoJson.put("contentType", a.httpProbe().contentType());
                }

                entity.setAnalysis(
                        objectMapper.writeValueAsString(a.detectedServices()),
                        objectMapper.writeValueAsString(httpInfoJson),
                        objectMapper.writeValueAsString(a.securityHeaders()),
                        a.riskScore(),
                        a.riskLevel(),
                        a.summary()
                );
            } catch (Exception ignored) {}
        } else {
            entity.fail(result.errorMessage());
        }
        return repository.save(entity);
    }

    @Transactional(readOnly = true)
    public Page<SecurityScanEntity> list(int page, int perPage) {
        return repository.findAllByOrderByCreatedAtDesc(
                PageRequest.of(Math.max(0, page - 1), perPage));
    }

    @Transactional(readOnly = true)
    public SecurityScanEntity getById(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("SecurityScan", id));
    }

    @Transactional(readOnly = true)
    public @Nullable SecurityScanEntity findLatest() {
        return repository.findTopByOrderByCreatedAtDesc().orElse(null);
    }

    private String joinPorts(java.util.List<Integer> ports) {
        return ports.stream().map(String::valueOf).collect(Collectors.joining(","));
    }
}
