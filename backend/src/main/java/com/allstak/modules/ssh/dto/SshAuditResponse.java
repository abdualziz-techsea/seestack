package com.allstak.modules.ssh.dto;

import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;

import java.time.Instant;
import java.util.UUID;

@NullMarked
public record SshAuditResponse(
        UUID id,
        UUID serverId,
        UUID projectId,
        UUID userId,
        @Nullable String command,
        @Nullable String output,
        Instant timestamp
) {}
