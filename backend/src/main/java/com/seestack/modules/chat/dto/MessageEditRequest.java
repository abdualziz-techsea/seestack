package com.seestack.modules.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.jspecify.annotations.NullMarked;

@NullMarked
public record MessageEditRequest(
        @NotBlank @Size(max = 4000) String content
) {}
