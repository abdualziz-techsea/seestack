package com.seestack.modules.billing.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PlanLimitsTest {

    @Test
    @DisplayName("Free plan has correct limits")
    void free() {
        PlanLimits p = PlanLimits.FREE;
        assertThat(p.getMaxErrors()).isEqualTo(1000);
        assertThat(p.getMaxMonitors()).isEqualTo(5);
        assertThat(p.getMaxSshServers()).isZero();
        assertThat(p.getMaxMembers()).isEqualTo(1);
        assertThat(p.getMaxProjects()).isEqualTo(1);
        assertThat(p.isUnlimited()).isFalse();
    }

    @Test
    @DisplayName("Scale plan is unlimited")
    void scale() {
        PlanLimits p = PlanLimits.SCALE;
        assertThat(p.isUnlimited()).isTrue();
        assertThat(p.getMaxErrors()).isEqualTo(-1);
    }

    @Test
    @DisplayName("fromPlanName resolves correctly")
    void fromPlanName() {
        assertThat(PlanLimits.fromPlanName("pro")).isEqualTo(PlanLimits.PRO);
        assertThat(PlanLimits.fromPlanName("PRO")).isEqualTo(PlanLimits.PRO);
        assertThat(PlanLimits.fromPlanName("unknown")).isEqualTo(PlanLimits.FREE);
    }
}
