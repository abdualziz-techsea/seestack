package com.allstak.modules.teams.dto;

import jakarta.validation.constraints.NotBlank;
import org.jspecify.annotations.NullMarked;

@NullMarked
public record ApiKeyCreateRequest(@NotBlank String name) {}
