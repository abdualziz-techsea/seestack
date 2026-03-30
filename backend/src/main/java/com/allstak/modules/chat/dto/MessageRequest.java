package com.allstak.modules.chat.dto;

import jakarta.validation.constraints.NotBlank;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;

import java.util.UUID;

@NullMarked
public record MessageRequest(
        @Nullable UUID userId,
        @Nullable String userName,
        @NotBlank String content,
        @Nullable UUID linkedErrorId
) {}
