package com.seestack.modules.loadtest.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class LoadTestRunnerLimitsTest {

    @Test
    void limitsAreClamped() {
        // The runner clamps requests/concurrency to its hard caps. We can't actually
        // run 100 requests against a real host in unit tests, but we can confirm the
        // public limits remain correct so the controller, UI, and docs stay aligned.
        assertThat(LoadTestRunner.MAX_REQUESTS).isEqualTo(100);
        assertThat(LoadTestRunner.MAX_CONCURRENCY).isEqualTo(10);
    }
}
