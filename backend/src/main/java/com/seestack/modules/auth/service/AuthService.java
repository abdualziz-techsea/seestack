package com.seestack.modules.auth.service;

import com.seestack.modules.auth.dto.AuthDtos;
import com.seestack.modules.teams.entity.UserEntity;
import com.seestack.modules.teams.repository.UserRepository;
import com.seestack.modules.teams.service.ProjectService;
import org.jspecify.annotations.NullMarked;
import org.jspecify.annotations.Nullable;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@NullMarked
public class AuthService {

    private final UserRepository userRepository;
    private final ProjectService projectService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository,
                       ProjectService projectService,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.userRepository = userRepository;
        this.projectService = projectService;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthDtos.AuthResponse register(String email, String password, @Nullable String name) {
        String normEmail = email.trim().toLowerCase();
        if (userRepository.findByEmail(normEmail).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }
        UserEntity user = userRepository.save(
                new UserEntity(normEmail, passwordEncoder.encode(password), name));
        var first = projectService.create(user.getId(), "My First Project", "web");
        String token = jwtService.issue(user.getId(), user.getEmail());
        return new AuthDtos.AuthResponse(
                token,
                new AuthDtos.UserDto(user.getId().toString(), user.getEmail(), user.getName()),
                new AuthDtos.ProjectDto(
                        first.project().getId().toString(),
                        first.project().getName(),
                        first.project().getSlug(),
                        first.rawKey()
                )
        );
    }

    @Transactional
    public AuthDtos.AuthResponse login(String email, String password) {
        String normEmail = email.trim().toLowerCase();
        UserEntity user = userRepository.findByEmail(normEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }
        String token = jwtService.issue(user.getId(), user.getEmail());
        return new AuthDtos.AuthResponse(
                token,
                new AuthDtos.UserDto(user.getId().toString(), user.getEmail(), user.getName()),
                null
        );
    }
}
