package com.allstak.modules.requests.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.jspecify.annotations.NullMarked;
import java.util.List;
import java.util.UUID;

@NullMarked
public record HttpRequestIngestRequest(
        @NotNull UUID projectId,
        @NotEmpty @Size(max = 100) @Valid List<HttpRequestItem> requests
) {}
