package com.seestack.shared.noop;

import org.jspecify.annotations.NullMarked;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Alerting is out of scope for the graduation-project final build.
 * This no-op lets the monitor scheduler and error pipeline compile
 * without pulling in the full alerts module.
 */
@Service
@NullMarked
public class NoopAlertService {
    public void onMonitorDown(UUID projectId, UUID monitorId, String name, String url) {}
    public void onMonitorSlowResponse(UUID projectId, UUID monitorId, String name, int responseTimeMs) {}
    public void onNewError(UUID projectId, String fingerprint, String exceptionClass) {}
    public void onErrorSpike(UUID projectId, String fingerprint, long occurrences) {}
}
