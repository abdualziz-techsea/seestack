package com.seestack.modules.teams.service;

import com.seestack.modules.teams.entity.ProjectMemberEntity;
import com.seestack.modules.teams.repository.ProjectMemberRepository;
import com.seestack.shared.exception.EntityNotFoundException;
import org.jspecify.annotations.NullMarked;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@NullMarked
public class ProjectMemberService {

    private final ProjectMemberRepository repository;

    public ProjectMemberService(ProjectMemberRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public ProjectMemberEntity addMember(UUID projectId, UUID userId,
                                          boolean canErrors, boolean canLogs,
                                          boolean canMonitors, boolean canSsh) {
        return repository.save(new ProjectMemberEntity(
                projectId, userId, canErrors, canLogs, canMonitors, canSsh));
    }

    @Transactional(readOnly = true)
    public Page<ProjectMemberEntity> list(UUID projectId, int page, int perPage) {
        return repository.findByProjectId(projectId,
                PageRequest.of(Math.max(0, page - 1), perPage, Sort.by(Sort.Direction.DESC, "createdAt")));
    }

    @Transactional
    public ProjectMemberEntity updatePermissions(UUID projectId, UUID memberId,
                                                   boolean canErrors, boolean canLogs,
                                                   boolean canMonitors, boolean canSsh) {
        ProjectMemberEntity entity = repository.findByIdAndProjectId(memberId, projectId)
                .orElseThrow(() -> new EntityNotFoundException("ProjectMember", memberId));
        entity.updatePermissions(canErrors, canLogs, canMonitors, canSsh);
        return repository.save(entity);
    }

    @Transactional
    public void removeMember(UUID projectId, UUID memberId) {
        ProjectMemberEntity entity = repository.findByIdAndProjectId(memberId, projectId)
                .orElseThrow(() -> new EntityNotFoundException("ProjectMember", memberId));
        repository.delete(entity);
    }

    @Transactional(readOnly = true)
    public boolean hasPermission(UUID projectId, UUID userId, String permission) {
        return repository.findByProjectIdAndUserId(projectId, userId)
                .map(member -> member.hasPermission(permission))
                .orElse(false);
    }
}
