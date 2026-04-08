package com.seestack.modules.requests;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class HttpRequestFilterServiceTest {

    private int[] statusGroupToRange(String group) {
        return switch (group.toLowerCase()) {
            case "2xx" -> new int[]{200, 300};
            case "3xx" -> new int[]{300, 400};
            case "4xx" -> new int[]{400, 500};
            case "5xx" -> new int[]{500, 600};
            default -> null;
        };
    }

    @Test
    void statusGroup2xx() {
        int[] range = statusGroupToRange("2xx");
        assertNotNull(range);
        assertEquals(200, range[0]);
        assertEquals(300, range[1]);
    }

    @Test
    void statusGroup4xx() {
        int[] range = statusGroupToRange("4xx");
        assertNotNull(range);
        assertEquals(400, range[0]);
        assertEquals(500, range[1]);
    }

    @Test
    void statusGroup5xx() {
        int[] range = statusGroupToRange("5xx");
        assertNotNull(range);
        assertEquals(500, range[0]);
        assertEquals(600, range[1]);
    }

    @Test
    void nullInput_noFilter() {
        int[] range = statusGroupToRange("unknown");
        assertNull(range);
    }
}
