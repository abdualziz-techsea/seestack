package com.seestack.modules.teams.repository;

import com.seestack.modules.teams.entity.UserEntity;
import org.jspecify.annotations.NullMarked;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@NullMarked
public interface UserRepository extends JpaRepository<UserEntity, UUID> {
    Optional<UserEntity> findByKeycloakId(String keycloakId);
    Optional<UserEntity> findByEmail(String email);
    List<UserEntity> findByOrgId(UUID orgId);
}
