package com.allstak.modules.teams.dto;

import jakarta.validation.constraints.NotNull;
import org.jspecify.annotations.NullMarked;

import java.util.UUID;

@NullMarked
public record MemberRequest(
        @NotNull UUID userId,
        boolean canErrors,
        boolean canLogs,
        boolean canMonitors,
        boolean canSsh
) {}
