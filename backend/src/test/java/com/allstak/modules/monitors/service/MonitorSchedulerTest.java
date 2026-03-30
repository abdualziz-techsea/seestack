package com.allstak.modules.monitors.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class MonitorSchedulerTest {

    @Test
    @DisplayName("200 response with fast latency is UP")
    void isUp_200_fast() {
        assertThat(MonitorScheduler.isUp(200, 145)).isTrue();
    }

    @Test
    @DisplayName("301 redirect is UP")
    void isUp_301_redirect() {
        assertThat(MonitorScheduler.isUp(301, 200)).isTrue();
    }

    @Test
    @DisplayName("204 no content is UP")
    void isUp_204() {
        assertThat(MonitorScheduler.isUp(204, 50)).isTrue();
    }

    @Test
    @DisplayName("500 server error is DOWN")
    void isDown_500() {
        assertThat(MonitorScheduler.isUp(500, 200)).isFalse();
    }

    @Test
    @DisplayName("404 not found is DOWN")
    void isDown_404() {
        assertThat(MonitorScheduler.isUp(404, 100)).isFalse();
    }

    @Test
    @DisplayName("0 status code (connection failure) is DOWN")
    void isDown_connectionFailure() {
        assertThat(MonitorScheduler.isUp(0, 5000)).isFalse();
    }

    @Test
    @DisplayName("200 with response time >= 30s is DOWN (timeout)")
    void isDown_timeout() {
        assertThat(MonitorScheduler.isUp(200, 30_000)).isFalse();
    }

    @Test
    @DisplayName("200 with response time just under 30s is UP")
    void isUp_justUnderTimeout() {
        assertThat(MonitorScheduler.isUp(200, 29_999)).isTrue();
    }

    @Test
    @DisplayName("399 response is UP (boundary)")
    void isUp_399() {
        assertThat(MonitorScheduler.isUp(399, 100)).isTrue();
    }

    @Test
    @DisplayName("400 response is DOWN (boundary)")
    void isDown_400() {
        assertThat(MonitorScheduler.isUp(400, 100)).isFalse();
    }
}
