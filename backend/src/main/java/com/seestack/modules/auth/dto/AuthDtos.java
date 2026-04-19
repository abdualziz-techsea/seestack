package com.seestack.modules.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;

@NullMarked
public final class AuthDtos {

    public record RegisterRequest(
            @Email @NotBlank String email,
            @NotBlank @Size(min = 8, max = 128) String password,
            @Nullable String name
    ) {}

    public record LoginRequest(
            @Email @NotBlank String email,
            @NotBlank String password
    ) {}

    public record AuthResponse(
            String token,
            UserDto user,
            @Nullable ProjectDto project
    ) {}

    public record UserDto(String id, String email, @Nullable String name) {}
    public record ProjectDto(String id, String name, String slug, @Nullable String apiKey) {}

    private AuthDtos() {}
}
