package com.allstak.modules.cron.dto;

import jakarta.validation.constraints.*;
import org.jspecify.annotations.NullMarked;
import java.util.UUID;

@NullMarked
public record CreateCronMonitorRequest(
        @NotNull UUID projectId,
        @NotBlank String name,
        @NotBlank @Pattern(regexp = "^[a-z0-9\\-]+$", message = "slug must be lowercase alphanumeric with hyphens") String slug,
        @NotBlank String schedule,
        @Min(1) @Max(1440) int gracePeriodMin
) {
    public CreateCronMonitorRequest {
        if (gracePeriodMin == 0) gracePeriodMin = 5;
    }
}
