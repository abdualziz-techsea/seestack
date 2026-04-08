package com.seestack.modules.flags.dto;

import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;

@NullMarked
public record TargetingRuleDto(
        String attribute,
        String operator,
        Object value,
        @Nullable String variant,
        boolean forceOverride
) {
    public TargetingRuleDto {
        if (attribute == null) attribute = "";
        if (operator == null) operator = "eq";
    }
}
