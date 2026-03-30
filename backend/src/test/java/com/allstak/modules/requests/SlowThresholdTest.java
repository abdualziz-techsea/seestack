package com.allstak.modules.requests;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class SlowThresholdTest {

    private static final int SLOW_THRESHOLD_MS = 1000;

    private int computeIsSlow(int durationMs) {
        return durationMs > SLOW_THRESHOLD_MS ? 1 : 0;
    }

    @Test
    void belowThreshold_notSlow() {
        assertEquals(0, computeIsSlow(999));
    }

    @Test
    void atThreshold_notSlow() {
        // Boundary: strictly greater than, so 1000 is NOT slow
        assertEquals(0, computeIsSlow(1000));
    }

    @Test
    void aboveThreshold_isSlow() {
        assertEquals(1, computeIsSlow(1001));
    }
}
