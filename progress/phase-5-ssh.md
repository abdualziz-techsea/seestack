# Phase 5 — SSH Manager

Status: Done
Branch: feature/ssh-phase5
Started: 2026-03-27
Completed: 2026-03-27

## Tasks

- [x] SSH server config CRUD (POST/GET/PUT/DELETE /api/v1/ssh/servers)
- [x] AES-256-GCM encryption for private keys at rest (SshEncryptionService)
- [x] WebSocket terminal session (/api/v1/ssh/terminal via Apache SSHD)
- [x] Audit log writer to ClickHouse via Kafka (seestack.ssh-audit topic)
- [x] Audit log query endpoint (GET /api/v1/ssh/servers/{id}/audit)
- [x] Unit tests for encryption service (8 tests)

## Testing

All curl tests passed on: 2026-03-27

- Create SSH server (201, key encrypted): PASS
- Create second server (custom port 2222): PASS
- Validation errors (422 on blank name): PASS
- List servers (2 items): PASS
- Get server detail (private key NOT in response): PASS
- Update server (name, host, username): PASS
- Verify encryption at rest in PostgreSQL: PASS
- WebSocket terminal handshake (101): PASS
- Audit log captured session-start event: PASS
- ClickHouse has audit records: PASS
- Delete server (204): PASS
- Phase 2/3/4 regression: PASS

## Bugs Fixed

1. **Thread.startVirtualThread() not available in JDK 17** — Replaced with `new Thread(...).start()`.

## Notes

- Private keys encrypted with AES-256-GCM (random IV per encryption)
- Encrypted keys stored as Base64 in PostgreSQL private_key_enc column
- Response DTOs never expose private key data
- WebSocket terminal connects to remote SSH via Apache SSHD client
- SSH I/O piped through WebSocket (stdin from client, stdout/stderr to client)
- All session events (start/end) logged to ClickHouse via Kafka
- Audit logs retained for 90 days (ClickHouse TTL)
