package com.allstak.modules.flags.service;

import com.allstak.modules.flags.dto.FlagEvaluationResult;
import com.allstak.modules.flags.dto.TargetingRuleDto;
import com.allstak.modules.flags.repository.FeatureFlagEntity;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.common.hash.Hashing;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@Service
@NullMarked
public class FlagEvaluationService {

    private static final Logger log = LoggerFactory.getLogger(FlagEvaluationService.class);

    private final ObjectMapper objectMapper;

    public FlagEvaluationService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public FlagEvaluationResult evaluate(FeatureFlagEntity flag, @Nullable String userId,
                                          Map<String, Object> attributes) {
        // 1. DISABLED
        if (!flag.isActive()) {
            return result(flag.getKey(), flag.getDefaultValue(), false, "DISABLED");
        }

        List<TargetingRuleDto> rules = parseRules(flag.getRules());

        // 2. FORCE_OVERRIDE
        for (TargetingRuleDto rule : rules) {
            if (rule.forceOverride() && matchesRule(rule, userId, attributes)) {
                String variant = rule.variant() != null ? rule.variant() : "true";
                return result(flag.getKey(), variant, true, "FORCE_OVERRIDE");
            }
        }

        // 3. PERCENTAGE_ROLLOUT
        if (flag.getRolloutPercent() > 0 && userId != null && !userId.isBlank()) {
            int bucket = computeBucket(userId, flag.getKey());
            if (bucket < flag.getRolloutPercent()) {
                // Check attribute rules for variant selection within rollout
                for (TargetingRuleDto rule : rules) {
                    if (!rule.forceOverride() && matchesRule(rule, userId, attributes)) {
                        String variant = rule.variant() != null ? rule.variant() : "true";
                        return result(flag.getKey(), variant, true, "ATTRIBUTE_RULE");
                    }
                }
                return result(flag.getKey(), "true", true, "PERCENTAGE_ROLLOUT");
            }
        }

        // 4. DEFAULT
        return result(flag.getKey(), flag.getDefaultValue(), false, "DEFAULT");
    }

    public int computeBucket(@Nullable String userId, String flagKey) {
        String seed = (userId != null ? userId : "") + ":" + flagKey;
        int hash = Hashing.murmur3_32_fixed().hashString(seed, StandardCharsets.UTF_8).asInt();
        return Math.abs(hash) % 100;
    }

    private boolean matchesRule(TargetingRuleDto rule, @Nullable String userId,
                                 Map<String, Object> attributes) {
        Object actual = "userId".equals(rule.attribute()) ? userId : attributes.get(rule.attribute());
        if (actual == null) return false;

        try {
            return switch (rule.operator()) {
                case "eq" -> actual.toString().equals(rule.value().toString());
                case "neq" -> !actual.toString().equals(rule.value().toString());
                case "in" -> rule.value() instanceof List<?> list &&
                        list.stream().anyMatch(v -> v.toString().equals(actual.toString()));
                case "not_in" -> !(rule.value() instanceof List<?> list) ||
                        list.stream().noneMatch(v -> v.toString().equals(actual.toString()));
                case "gt" -> Double.parseDouble(actual.toString()) > Double.parseDouble(rule.value().toString());
                case "lt" -> Double.parseDouble(actual.toString()) < Double.parseDouble(rule.value().toString());
                default -> false;
            };
        } catch (Exception e) {
            log.debug("Rule evaluation failed for attribute={}, operator={}: {}",
                    rule.attribute(), rule.operator(), e.getMessage());
            return false;
        }
    }

    private List<TargetingRuleDto> parseRules(String rulesJson) {
        try {
            return objectMapper.readValue(rulesJson, new TypeReference<>() {});
        } catch (Exception e) {
            log.warn("Failed to parse rules JSON: {}", e.getMessage());
            return List.of();
        }
    }

    private FlagEvaluationResult result(String key, String variant, boolean enabled, String reason) {
        return new FlagEvaluationResult(key, variant, enabled, reason);
    }
}
