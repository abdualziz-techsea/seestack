package com.allstak.modules.monitors.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import org.jspecify.annotations.NullMarked;

import java.util.UUID;

@NullMarked
public record MonitorCreateRequest(
        @NotNull UUID projectId,
        @NotBlank String name,
        @NotBlank @Pattern(regexp = "https?://.+", message = "must be a valid HTTP/HTTPS URL") String url,
        int intervalMinutes
) {
    public MonitorCreateRequest {
        if (intervalMinutes != 1 && intervalMinutes != 5 && intervalMinutes != 10) {
            intervalMinutes = 5;
        }
    }
}
