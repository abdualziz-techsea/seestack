package com.allstak.modules.billing.service;

import org.jspecify.annotations.NullMarked;

@NullMarked
public enum PlanLimits {
    FREE("free", 1000, 5, 0, 1, 1),
    STARTER("starter", 20000, 20, 2, 5, 3),
    PRO("pro", 100000, 100, 10, 20, 10),
    SCALE("scale", -1, -1, -1, -1, -1);

    private final String planName;
    private final long maxErrors;
    private final int maxMonitors;
    private final int maxSshServers;
    private final int maxMembers;
    private final int maxProjects;

    PlanLimits(String planName, long maxErrors, int maxMonitors,
               int maxSshServers, int maxMembers, int maxProjects) {
        this.planName = planName;
        this.maxErrors = maxErrors;
        this.maxMonitors = maxMonitors;
        this.maxSshServers = maxSshServers;
        this.maxMembers = maxMembers;
        this.maxProjects = maxProjects;
    }

    public String getPlanName() { return planName; }
    public long getMaxErrors() { return maxErrors; }
    public int getMaxMonitors() { return maxMonitors; }
    public int getMaxSshServers() { return maxSshServers; }
    public int getMaxMembers() { return maxMembers; }
    public int getMaxProjects() { return maxProjects; }

    public boolean isUnlimited() { return maxErrors == -1; }

    public static PlanLimits fromPlanName(String plan) {
        for (PlanLimits p : values()) {
            if (p.planName.equalsIgnoreCase(plan)) return p;
        }
        return FREE;
    }
}
