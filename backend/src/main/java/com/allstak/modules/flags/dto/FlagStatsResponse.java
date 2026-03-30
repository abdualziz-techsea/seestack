package com.allstak.modules.flags.dto;

import org.jspecify.annotations.NullMarked;
import java.util.Map;

@NullMarked
public record FlagStatsResponse(
        String flagKey,
        Map<String, VariantStats> variants
) {
    public record VariantStats(long errorCount, double errorRate, long logCount) {}
}
