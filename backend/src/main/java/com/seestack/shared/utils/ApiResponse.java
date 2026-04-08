package com.seestack.shared.utils;

import com.fasterxml.jackson.annotation.JsonInclude;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;

import java.time.Instant;
import java.util.UUID;

/**
 * Standard API response wrapper for all SeeStack endpoints.
 */
@NullMarked
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(
        boolean success,
        @Nullable T data,
        @Nullable ErrorBody error,
        Meta meta
) {

    public static <T> ApiResponse<T> ok(@Nullable T data) {
        return new ApiResponse<>(true, data, null, Meta.now());
    }

    public static <T> ApiResponse<T> error(String code, String message, @Nullable Object details) {
        return new ApiResponse<>(false, null, new ErrorBody(code, message, details), Meta.now());
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record ErrorBody(
            String code,
            String message,
            @Nullable Object details
    ) {}

    public record Meta(
            String requestId,
            String timestamp
    ) {
        static Meta now() {
            return new Meta(UUID.randomUUID().toString(), Instant.now().toString());
        }
    }
}
