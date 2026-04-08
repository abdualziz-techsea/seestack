package com.seestack.modules.errors.dto;

import org.jspecify.annotations.NullMarked;

@NullMarked
public record ErrorIngestResponse(
        boolean ok,
        String id
) {}
