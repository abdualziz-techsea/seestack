package com.allstak.modules.ssh.repository;

import com.allstak.modules.ssh.entity.SshServerEntity;
import org.jspecify.annotations.NullMarked;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

@NullMarked
public interface SshServerRepository extends JpaRepository<SshServerEntity, UUID> {

    Page<SshServerEntity> findByProjectId(UUID projectId, Pageable pageable);

    Optional<SshServerEntity> findByIdAndProjectId(UUID id, UUID projectId);
}
