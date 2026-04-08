package com.seestack.modules.alerts.service;

import com.seestack.modules.alerts.dto.AlertTriggerEvent;
import com.seestack.modules.alerts.entity.AlertRuleEntity;
import com.seestack.modules.alerts.entity.NotificationLogEntity;
import com.seestack.modules.alerts.repository.NotificationLogRepository;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@NullMarked
public class AlertEvaluationService {

    private static final Logger log = LoggerFactory.getLogger(AlertEvaluationService.class);

    private final AlertRuleService ruleService;
    private final QuietHoursService quietHoursService;
    private final NotificationDispatcherService dispatcher;
    private final NotificationLogRepository logRepository;

    public AlertEvaluationService(AlertRuleService ruleService,
                                   QuietHoursService quietHoursService,
                                   NotificationDispatcherService dispatcher,
                                   NotificationLogRepository logRepository) {
        this.ruleService = ruleService;
        this.quietHoursService = quietHoursService;
        this.dispatcher = dispatcher;
        this.logRepository = logRepository;
    }

    public void onNewError(UUID projectId, String fingerprint, String exceptionClass,
                           @Nullable String environment) {
        evaluate(projectId, "new_error", "critical",
                "New error detected — " + exceptionClass,
                "First occurrence of " + exceptionClass + " in " +
                        (environment != null ? environment : "unknown"),
                null);
    }

    public void onErrorSpike(UUID projectId, int errorCount, int windowMinutes,
                              @Nullable String environment) {
        List<AlertRuleEntity> rules = ruleService.findEnabledRules(projectId, "error_spike");
        for (AlertRuleEntity rule : rules) {
            Map<String, Object> config = rule.getTriggerConfig();
            int threshold = ((Number) config.getOrDefault("threshold", 10)).intValue();
            if (errorCount >= threshold) {
                evaluateRule(rule, projectId, "critical",
                        "Error spike detected",
                        errorCount + " errors in the last " + windowMinutes + " minutes",
                        null);
            }
        }
    }

    public void onMonitorDown(UUID projectId, UUID monitorId, String monitorName, String url) {
        evaluate(projectId, "monitor_down", "critical",
                "Monitor DOWN — " + monitorName,
                monitorName + " (" + url + ") is not responding",
                null);
    }

    public void onMonitorSlowResponse(UUID projectId, UUID monitorId, String monitorName, long responseMs) {
        List<AlertRuleEntity> rules = ruleService.findEnabledRules(projectId, "monitor_response_time");
        for (AlertRuleEntity rule : rules) {
            Map<String, Object> config = rule.getTriggerConfig();
            int thresholdMs = ((Number) config.getOrDefault("threshold_ms", 2000)).intValue();
            if (responseMs >= thresholdMs) {
                evaluateRule(rule, projectId, "warning",
                        "Slow response — " + monitorName,
                        monitorName + " responded in " + responseMs + "ms (threshold: " + thresholdMs + "ms)",
                        null);
            }
        }
    }

    // ── Cron Job Alerts ──────────────────────────────────────

    public void evaluateJobFailed(UUID monitorId, UUID projectId, String message) {
        evaluate(projectId, "job_failed", "critical",
                "Cron job failed",
                "Job " + monitorId + " failed: " + message,
                null);
    }

    public void evaluateJobMissed(UUID monitorId, UUID projectId, String monitorName) {
        evaluate(projectId, "job_missed", "warning",
                "Cron job missed: " + monitorName,
                monitorName + " did not run within its scheduled window",
                null);
    }

    public void evaluateJobDurationSpike(UUID monitorId, UUID projectId, String monitorName,
                                          long actualMs, long avgMs) {
        evaluate(projectId, "job_duration_spike", "warning",
                "Cron job slow: " + monitorName,
                monitorName + " took " + actualMs + "ms (average: " + avgMs + "ms)",
                null);
    }

    // ── Feature Flag Alerts ─────────────────────────────────

    public void evaluateFlagErrorSpike(String flagKey, String variant, UUID projectId, double errorRate) {
        List<AlertRuleEntity> rules = ruleService.findEnabledRules(projectId, "flag_error_spike");
        for (AlertRuleEntity rule : rules) {
            Map<String, Object> config = rule.getTriggerConfig();
            double threshold = ((Number) config.getOrDefault("thresholdPercent", 5)).doubleValue();
            String targetKey = (String) config.getOrDefault("flagKey", "");
            if (targetKey.equals(flagKey) && errorRate >= threshold) {
                evaluateRule(rule, projectId, "warning",
                        "Feature flag error spike: " + flagKey,
                        flagKey + " (variant: " + variant + ") — error rate " +
                                String.format("%.1f%%", errorRate) + " exceeds threshold " +
                                String.format("%.1f%%", threshold),
                        null);
            }
        }
    }

    // ── HTTP Request Alerts ──────────────────────────────────

    public void onHttpErrorRate(UUID projectId, double errorRate, int windowMinutes) {
        List<AlertRuleEntity> rules = ruleService.findEnabledRules(projectId, "http_error_rate");
        for (AlertRuleEntity rule : rules) {
            Map<String, Object> config = rule.getTriggerConfig();
            double threshold = ((Number) config.getOrDefault("thresholdPercent", 10)).doubleValue();
            if (errorRate >= threshold) {
                evaluateRule(rule, projectId, "critical",
                        "HTTP error rate elevated",
                        String.format("%.1f%% error rate in the last %d minutes (threshold: %.1f%%)",
                                errorRate, windowMinutes, threshold),
                        null);
            }
        }
    }

    public void onHttpSlowEndpoint(UUID projectId, long p95Ms) {
        List<AlertRuleEntity> rules = ruleService.findEnabledRules(projectId, "http_slow_endpoint");
        for (AlertRuleEntity rule : rules) {
            Map<String, Object> config = rule.getTriggerConfig();
            int thresholdMs = ((Number) config.getOrDefault("thresholdMs", 2000)).intValue();
            if (p95Ms >= thresholdMs) {
                evaluateRule(rule, projectId, "warning",
                        "Slow HTTP endpoints detected",
                        "P95 response time: " + p95Ms + "ms (threshold: " + thresholdMs + "ms)",
                        null);
            }
        }
    }

    public void onHttpOutboundDown(UUID projectId, String host, int consecutiveFailures) {
        List<AlertRuleEntity> rules = ruleService.findEnabledRules(projectId, "http_outbound_down");
        for (AlertRuleEntity rule : rules) {
            Map<String, Object> config = rule.getTriggerConfig();
            int threshold = ((Number) config.getOrDefault("consecutiveFailures", 3)).intValue();
            String targetHost = (String) config.getOrDefault("host", "");
            if (targetHost.equals(host) && consecutiveFailures >= threshold) {
                evaluateRule(rule, projectId, "critical",
                        "Outbound service down — " + host,
                        host + " has " + consecutiveFailures + " consecutive failures",
                        null);
            }
        }
    }

    public void onSshSessionStarted(UUID projectId, UUID serverId, String serverName, String username) {
        evaluate(projectId, "ssh_session_started", "info",
                "SSH session started — " + serverName,
                "User " + username + " opened an SSH session on " + serverName,
                null);
    }

    private void evaluate(UUID projectId, String triggerType, String severity,
                          String title, String description, @Nullable String deepLinkUrl) {
        List<AlertRuleEntity> rules = ruleService.findEnabledRules(projectId, triggerType);
        for (AlertRuleEntity rule : rules) {
            evaluateRule(rule, projectId, severity, title, description, deepLinkUrl);
        }
    }

    private void evaluateRule(AlertRuleEntity rule, UUID projectId, String severity,
                               String title, String description, @Nullable String deepLinkUrl) {
        // Check severity filter
        if ("critical".equals(rule.getSeverityFilter()) && !"critical".equals(severity)) {
            log.debug("Rule {} skipped — severity filter (wants critical, got {})", rule.getId(), severity);
            return;
        }

        // Check quiet hours
        ZoneId timezone = ZoneId.of("UTC"); // Default; could be org-specific
        if (quietHoursService.isQuietTime(rule, timezone)) {
            log.debug("Rule {} skipped — quiet hours active", rule.getId());
            for (Map<String, Object> ch : rule.getChannels()) {
                logRepository.save(new NotificationLogEntity(
                        rule.getId(), projectId, rule.getTriggerType(),
                        (String) ch.get("type"), "skipped_quiet_hours", null, null));
            }
            return;
        }

        // Build event and dispatch
        AlertTriggerEvent event = new AlertTriggerEvent(
                projectId, "Project", rule.getTriggerType(), severity,
                title, description, deepLinkUrl, Instant.now());

        dispatcher.dispatch(event, rule);
    }
}
