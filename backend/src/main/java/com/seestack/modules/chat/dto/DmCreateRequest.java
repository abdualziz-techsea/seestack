package com.seestack.modules.chat.dto;

import jakarta.validation.constraints.NotNull;
import org.jspecify.annotations.NullMarked;
import java.util.UUID;

@NullMarked
public record DmCreateRequest(
        @NotNull UUID targetUserId
) {}
