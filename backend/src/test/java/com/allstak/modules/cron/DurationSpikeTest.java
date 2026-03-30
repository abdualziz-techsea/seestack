package com.allstak.modules.cron;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class DurationSpikeTest {

    private boolean isSpike(long actualMs, double avgMs) {
        if (avgMs <= 0) return false;
        return actualMs > avgMs * 1.5;
    }

    @Test
    void noSpike() {
        assertFalse(isSpike(1000, 800)); // 1000 < 800*1.5=1200
    }

    @Test
    void spike() {
        assertTrue(isSpike(1300, 800)); // 1300 > 800*1.5=1200
    }

    @Test
    void zeroAvg_skipCheck() {
        assertFalse(isSpike(1000, 0)); // avg=0 → skip
    }
}
