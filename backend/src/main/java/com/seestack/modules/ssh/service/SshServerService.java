package com.seestack.modules.ssh.service;

import com.seestack.modules.ssh.entity.SshServerEntity;
import com.seestack.modules.ssh.repository.SshServerRepository;
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
public class SshServerService {

    private final SshServerRepository repository;
    private final SshEncryptionService encryption;

    public SshServerService(SshServerRepository repository, SshEncryptionService encryption) {
        this.repository = repository;
        this.encryption = encryption;
    }

    @Transactional
    public SshServerEntity create(UUID projectId, String name, String host, int port,
                                   String username, String privateKey) {
        String encrypted = encryption.encrypt(privateKey);
        var entity = new SshServerEntity(projectId, name, host, port, username, encrypted);
        return repository.save(entity);
    }

    @Transactional(readOnly = true)
    public Page<SshServerEntity> list(UUID projectId, int page, int perPage) {
        PageRequest pageable = PageRequest.of(Math.max(0, page - 1), perPage,
                Sort.by(Sort.Direction.DESC, "createdAt"));
        return repository.findByProjectId(projectId, pageable);
    }

    @Transactional(readOnly = true)
    public SshServerEntity getById(UUID projectId, UUID serverId) {
        return repository.findByIdAndProjectId(serverId, projectId)
                .orElseThrow(() -> new EntityNotFoundException("SshServer", serverId));
    }

    @Transactional
    public SshServerEntity update(UUID projectId, UUID serverId,
                                   String name, String host, int port,
                                   String username, String privateKey) {
        SshServerEntity entity = getById(projectId, serverId);
        String encrypted = encryption.encrypt(privateKey);
        entity.update(name, host, port, username, encrypted);
        return repository.save(entity);
    }

    @Transactional
    public void delete(UUID projectId, UUID serverId) {
        SshServerEntity entity = getById(projectId, serverId);
        repository.delete(entity);
    }

    /**
     * Returns the decrypted private key for establishing SSH connections.
     */
    public String getDecryptedPrivateKey(SshServerEntity server) {
        return encryption.decrypt(server.getPrivateKeyEnc());
    }
}
