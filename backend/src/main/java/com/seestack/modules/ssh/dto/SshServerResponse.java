package com.seestack.modules.ssh.dto;

import com.seestack.modules.ssh.entity.SshServerEntity;
import org.jspecify.annotations.NullMarked;

import java.time.Instant;
import java.util.UUID;

@NullMarked
public record SshServerResponse(
        UUID id,
        UUID projectId,
        String name,
        String host,
        int port,
        String username,
        Instant createdAt
) {
    public static SshServerResponse from(SshServerEntity e) {
        return new SshServerResponse(
                e.getId(), e.getProjectId(), e.getName(), e.getHost(),
                e.getPort(), e.getUsername(), e.getCreatedAt()
        );
    }
}
