package com.allstak.modules.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.jspecify.annotations.NullMarked;

@NullMarked
public record ReactionRequest(
        @NotBlank @Size(min = 1, max = 10) String emoji
) {}
