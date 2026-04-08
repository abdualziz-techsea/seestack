package com.seestack.modules.teams.service;

import com.seestack.modules.teams.entity.ProjectMemberEntity;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class ProjectMemberPermissionTest {

    private static final UUID PROJECT = UUID.randomUUID();
    private static final UUID USER = UUID.randomUUID();

    @Test
    @DisplayName("Member with errors permission can access errors")
    void hasPermission_errors() {
        var member = new ProjectMemberEntity(PROJECT, USER, true, false, false, false);
        assertThat(member.hasPermission("errors")).isTrue();
        assertThat(member.hasPermission("logs")).isFalse();
        assertThat(member.hasPermission("monitors")).isFalse();
        assertThat(member.hasPermission("ssh")).isFalse();
    }

    @Test
    @DisplayName("Member with all permissions can access everything")
    void hasPermission_all() {
        var member = new ProjectMemberEntity(PROJECT, USER, true, true, true, true);
        assertThat(member.hasPermission("errors")).isTrue();
        assertThat(member.hasPermission("logs")).isTrue();
        assertThat(member.hasPermission("monitors")).isTrue();
        assertThat(member.hasPermission("ssh")).isTrue();
    }

    @Test
    @DisplayName("Member with no permissions cannot access anything")
    void hasPermission_none() {
        var member = new ProjectMemberEntity(PROJECT, USER, false, false, false, false);
        assertThat(member.hasPermission("errors")).isFalse();
        assertThat(member.hasPermission("logs")).isFalse();
        assertThat(member.hasPermission("monitors")).isFalse();
        assertThat(member.hasPermission("ssh")).isFalse();
    }

    @Test
    @DisplayName("SSH permission is independent from other permissions")
    void hasPermission_sshIndependent() {
        var memberWithAllButSsh = new ProjectMemberEntity(PROJECT, USER, true, true, true, false);
        assertThat(memberWithAllButSsh.hasPermission("ssh")).isFalse();

        var memberWithSshOnly = new ProjectMemberEntity(PROJECT, USER, false, false, false, true);
        assertThat(memberWithSshOnly.hasPermission("ssh")).isTrue();
        assertThat(memberWithSshOnly.hasPermission("errors")).isFalse();
    }

    @Test
    @DisplayName("Unknown permission returns false")
    void hasPermission_unknown() {
        var member = new ProjectMemberEntity(PROJECT, USER, true, true, true, true);
        assertThat(member.hasPermission("billing")).isFalse();
        assertThat(member.hasPermission("admin")).isFalse();
        assertThat(member.hasPermission("")).isFalse();
    }

    @Test
    @DisplayName("updatePermissions changes flags correctly")
    void updatePermissions() {
        var member = new ProjectMemberEntity(PROJECT, USER, false, false, false, false);
        member.updatePermissions(true, true, false, false);
        assertThat(member.isCanErrors()).isTrue();
        assertThat(member.isCanLogs()).isTrue();
        assertThat(member.isCanMonitors()).isFalse();
        assertThat(member.isCanSsh()).isFalse();
    }
}
