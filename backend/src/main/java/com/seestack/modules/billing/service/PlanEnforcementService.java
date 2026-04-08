package com.seestack.modules.billing.service;

import org.jspecify.annotations.NullMarked;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@NullMarked
public class PlanEnforcementService {

    private final JdbcClient jdbc;

    public PlanEnforcementService(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public PlanLimits getLimits(UUID orgId) {
        String plan = jdbc.sql("SELECT plan FROM organizations WHERE id = :orgId")
                .param("orgId", orgId)
                .query((rs, rowNum) -> rs.getString("plan"))
                .optional()
                .orElse("free");
        return PlanLimits.fromPlanName(plan);
    }

    public boolean canAddMonitor(UUID orgId) {
        PlanLimits limits = getLimits(orgId);
        if (limits.isUnlimited()) return true;
        long current = countByOrg("monitor_configs", orgId);
        return current < limits.getMaxMonitors();
    }

    public boolean canAddSshServer(UUID orgId) {
        PlanLimits limits = getLimits(orgId);
        if (limits.isUnlimited()) return true;
        long current = countByOrg("ssh_servers", orgId);
        return current < limits.getMaxSshServers();
    }

    public boolean canAddProject(UUID orgId) {
        PlanLimits limits = getLimits(orgId);
        if (limits.isUnlimited()) return true;
        long current = jdbc.sql("SELECT count(*) FROM projects WHERE org_id = :orgId")
                .param("orgId", orgId).query((rs, rowNum) -> rs.getLong(1)).single();
        return current < limits.getMaxProjects();
    }

    public boolean canAddMember(UUID orgId) {
        PlanLimits limits = getLimits(orgId);
        if (limits.isUnlimited()) return true;
        long current = jdbc.sql("SELECT count(*) FROM users WHERE org_id = :orgId")
                .param("orgId", orgId).query((rs, rowNum) -> rs.getLong(1)).single();
        return current < limits.getMaxMembers();
    }

    private long countByOrg(String table, UUID orgId) {
        // Count across all projects belonging to the org
        return jdbc.sql("SELECT count(*) FROM " + table + " t JOIN projects p ON t.project_id = p.id WHERE p.org_id = :orgId")
                .param("orgId", orgId).query((rs, rowNum) -> rs.getLong(1)).single();
    }
}
