package com.allstak.modules.cron.service;

import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;
import org.springframework.scheduling.support.CronExpression;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
@NullMarked
public class CronScheduleParser {

    private static final Pattern INTERVAL_PATTERN = Pattern.compile("^(\\d+)([mhd])$");

    public Instant computeNextExpectedAt(@Nullable Instant lastPingAt, Instant createdAt, String schedule) {
        Instant base = lastPingAt != null ? lastPingAt : createdAt;

        Matcher matcher = INTERVAL_PATTERN.matcher(schedule);
        if (matcher.matches()) {
            int value = Integer.parseInt(matcher.group(1));
            String unit = matcher.group(2);
            Duration interval = switch (unit) {
                case "m" -> Duration.ofMinutes(value);
                case "h" -> Duration.ofHours(value);
                case "d" -> Duration.ofDays(value);
                default -> Duration.ofHours(1);
            };
            return base.plus(interval);
        }

        // Cron expression — use Spring's CronExpression
        try {
            // Spring CronExpression uses 6-field format (seconds included)
            // Convert 5-field to 6-field by prepending "0 "
            String cronExpr = schedule.trim().split("\\s+").length == 5 ? "0 " + schedule : schedule;
            CronExpression cron = CronExpression.parse(cronExpr);
            LocalDateTime baseTime = LocalDateTime.ofInstant(base, ZoneOffset.UTC);
            LocalDateTime next = cron.next(baseTime);
            return next != null ? next.toInstant(ZoneOffset.UTC) : base.plus(Duration.ofHours(24));
        } catch (Exception e) {
            // Fallback: assume 24h interval if cron parsing fails
            return base.plus(Duration.ofHours(24));
        }
    }
}
