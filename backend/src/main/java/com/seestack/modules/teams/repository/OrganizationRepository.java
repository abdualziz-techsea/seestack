package com.seestack.modules.teams.repository;

import com.seestack.modules.teams.entity.OrganizationEntity;
import org.jspecify.annotations.NullMarked;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

@NullMarked
public interface OrganizationRepository extends JpaRepository<OrganizationEntity, UUID> {
    Optional<OrganizationEntity> findBySlug(String slug);
    boolean existsBySlug(String slug);
}
