package com.allstak.modules.ssh.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.jspecify.annotations.NullMarked;

import java.util.UUID;

@NullMarked
public record SshServerCreateRequest(
        @NotNull UUID projectId,
        @NotBlank String name,
        @NotBlank String host,
        @Min(1) @Max(65535) int port,
        @NotBlank String username,
        @NotBlank String privateKey
) {
    public SshServerCreateRequest {
        if (port == 0) port = 22;
    }
}
