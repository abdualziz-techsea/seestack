package com.seestack.modules.alerts.service;

import com.seestack.modules.alerts.entity.AlertRuleEntity;
import org.jspecify.annotations.NullMarked;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.time.ZoneId;

@Service
@NullMarked
public class QuietHoursService {

    public boolean isQuietTime(AlertRuleEntity rule, ZoneId orgTimezone) {
        if (!rule.isQuietHoursEnabled()) return false;

        LocalTime now = LocalTime.now(orgTimezone);
        LocalTime start = rule.getQuietStart();
        LocalTime end = rule.getQuietEnd();

        // Handle overnight range (e.g. 23:00 -> 08:00)
        if (start.isAfter(end)) {
            return now.isAfter(start) || now.isBefore(end);
        }
        return now.isAfter(start) && now.isBefore(end);
    }
}
