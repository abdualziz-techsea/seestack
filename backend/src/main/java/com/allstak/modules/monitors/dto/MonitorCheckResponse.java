package com.allstak.modules.monitors.dto;

import org.jspecify.annotations.NullMarked;

import java.time.Instant;

@NullMarked
public record MonitorCheckResponse(
        Instant timestamp,
        int status,
        int responseTimeMs,
        int statusCode
) {}
