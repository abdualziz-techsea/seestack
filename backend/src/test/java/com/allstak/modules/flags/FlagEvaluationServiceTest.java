package com.allstak.modules.flags;

import com.allstak.modules.flags.dto.FlagEvaluationResult;
import com.allstak.modules.flags.repository.FeatureFlagEntity;
import com.allstak.modules.flags.service.FlagEvaluationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class FlagEvaluationServiceTest {

    private FlagEvaluationService service;

    @BeforeEach
    void setUp() {
        service = new FlagEvaluationService(new ObjectMapper());
    }

    private FeatureFlagEntity makeFlag(String key, boolean active, int rollout, String rules) {
        var flag = new FeatureFlagEntity(UUID.randomUUID(), key, "Test", "", "boolean", "false", rollout, rules);
        if (active) flag.toggleActive();
        return flag;
    }

    @Test
    void disabledFlag_returnsDefault() {
        var flag = makeFlag("test", false, 100, "[]");
        var result = service.evaluate(flag, "user-1", Map.of());
        assertEquals("false", result.variant());
        assertEquals("DISABLED", result.reason());
        assertFalse(result.enabled());
    }

    @Test
    void percentageRollout_inRange() {
        var flag = makeFlag("checkout", true, 100, "[]");
        var result = service.evaluate(flag, "user-abc", Map.of());
        assertEquals("true", result.variant());
        assertEquals("PERCENTAGE_ROLLOUT", result.reason());
        assertTrue(result.enabled());
    }

    @Test
    void percentageRollout_zeroPercent() {
        var flag = makeFlag("checkout", true, 0, "[]");
        var result = service.evaluate(flag, "user-abc", Map.of());
        assertEquals("false", result.variant());
        assertEquals("DEFAULT", result.reason());
        assertFalse(result.enabled());
    }

    @Test
    void targetingRule_eq_match() {
        var flag = makeFlag("test", true, 100,
                "[{\"attribute\":\"plan\",\"operator\":\"eq\",\"value\":\"pro\",\"variant\":\"v2\",\"forceOverride\":false}]");
        var result = service.evaluate(flag, "user-1", Map.of("plan", "pro"));
        assertEquals("v2", result.variant());
        assertEquals("ATTRIBUTE_RULE", result.reason());
    }

    @Test
    void targetingRule_noMatch() {
        var flag = makeFlag("test", true, 100,
                "[{\"attribute\":\"plan\",\"operator\":\"eq\",\"value\":\"pro\",\"variant\":\"v2\",\"forceOverride\":false}]");
        var result = service.evaluate(flag, "user-1", Map.of("plan", "free"));
        assertEquals("true", result.variant()); // Falls through to rollout
        assertEquals("PERCENTAGE_ROLLOUT", result.reason());
    }

    @Test
    void forceOverride_takesPriority() {
        var flag = makeFlag("test", true, 100,
                "[{\"attribute\":\"userId\",\"operator\":\"eq\",\"value\":\"admin\",\"variant\":\"true\",\"forceOverride\":true}]");
        var result = service.evaluate(flag, "admin", Map.of());
        assertEquals("true", result.variant());
        assertEquals("FORCE_OVERRIDE", result.reason());
    }

    @Test
    void inOperator() {
        var flag = makeFlag("test", true, 100,
                "[{\"attribute\":\"country\",\"operator\":\"in\",\"value\":[\"SA\",\"AE\",\"KW\"],\"forceOverride\":false}]");
        var result = service.evaluate(flag, "user-1", Map.of("country", "SA"));
        assertEquals("ATTRIBUTE_RULE", result.reason());
    }

    @Test
    void multiVariantStringFlag() {
        var flag = new FeatureFlagEntity(UUID.randomUUID(), "pricing", "Pricing", "", "string", "\"control\"", 100,
                "[{\"attribute\":\"plan\",\"operator\":\"eq\",\"value\":\"pro\",\"variant\":\"v2\",\"forceOverride\":false}]");
        flag.toggleActive();
        var result = service.evaluate(flag, "user-1", Map.of("plan", "pro"));
        assertEquals("v2", result.variant());
    }

    @Test
    void nullUserId_fallsToDefault() {
        var flag = makeFlag("test", true, 50, "[]");
        var result = service.evaluate(flag, null, Map.of());
        assertEquals("DEFAULT", result.reason());
    }

    @Test
    void consistentHash_sameResult() {
        int bucket1 = service.computeBucket("test-user-1", "my-flag");
        int bucket2 = service.computeBucket("test-user-1", "my-flag");
        assertEquals(bucket1, bucket2);
        // Run 1000 times — always same
        for (int i = 0; i < 1000; i++) {
            assertEquals(bucket1, service.computeBucket("test-user-1", "my-flag"));
        }
    }
}
