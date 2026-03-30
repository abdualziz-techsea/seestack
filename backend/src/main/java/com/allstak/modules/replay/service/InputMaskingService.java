package com.allstak.modules.replay.service;

import org.jspecify.annotations.NullMarked;
import org.springframework.stereotype.Service;

import java.util.regex.Pattern;

/**
 * Masks sensitive input values in replay event data.
 * Redacts password fields, credit card numbers, and other PII.
 */
@Service
@NullMarked
public class InputMaskingService {

    private static final Pattern PASSWORD_PATTERN = Pattern.compile(
            "(\"type\"\\s*:\\s*\"password\"[^}]*\"value\"\\s*:\\s*\")([^\"]*)(\")",
            Pattern.CASE_INSENSITIVE);

    private static final Pattern CARD_PATTERN = Pattern.compile(
            "\\b(\\d{4})[- ]?(\\d{4})[- ]?(\\d{4})[- ]?(\\d{4})\\b");

    private static final Pattern SENSITIVE_FIELD_PATTERN = Pattern.compile(
            "(\"(?:password|secret|token|ssn|cvv|cvc|pin)\"\\s*:\\s*\")([^\"]*)(\")",
            Pattern.CASE_INSENSITIVE);

    private static final String MASK = "***REDACTED***";

    /**
     * Masks sensitive data in event data JSON string.
     */
    public String mask(String eventData) {
        String result = eventData;
        result = PASSWORD_PATTERN.matcher(result).replaceAll("$1" + MASK + "$3");
        result = CARD_PATTERN.matcher(result).replaceAll("****-****-****-$4");
        result = SENSITIVE_FIELD_PATTERN.matcher(result).replaceAll("$1" + MASK + "$3");
        return result;
    }

    /**
     * Checks if the event data contains any sensitive patterns.
     */
    public boolean containsSensitiveData(String eventData) {
        return PASSWORD_PATTERN.matcher(eventData).find()
                || CARD_PATTERN.matcher(eventData).find()
                || SENSITIVE_FIELD_PATTERN.matcher(eventData).find();
    }
}
