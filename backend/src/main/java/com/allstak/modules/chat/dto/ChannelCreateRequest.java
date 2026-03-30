package com.allstak.modules.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.jspecify.annotations.NullMarked;

import java.util.UUID;

@NullMarked
public record ChannelCreateRequest(
        @NotNull UUID orgId,
        @NotBlank String name
) {}
