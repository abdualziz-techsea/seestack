package com.allstak.modules.errors.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;

import java.util.List;
import java.util.Map;

@NullMarked
public record ErrorIngestRequest(
        @NotBlank String exceptionClass,
        @NotBlank String message,
        @Nullable List<String> stackTrace,
        @Nullable @Pattern(regexp = "debug|info|warn|error|fatal|warning") String level,
        @Nullable String environment,
        @Nullable String release,
        @Nullable @Valid UserContext user,
        @Nullable Map<String, Object> metadata
) {
    public record UserContext(
            @Nullable String id,
            @Nullable String email,
            @Nullable String ip
    ) {}
}
