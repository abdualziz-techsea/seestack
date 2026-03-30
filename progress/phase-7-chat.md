# Phase 7 — Chat

Status: Done
Branch: feature/chat-enhancements-phase7
Started: 2026-03-27 (base) / 2026-03-28 (enhancements)
Completed: 2026-03-28

## Tasks

### Base (Done — 2026-03-27)
- [x] Channel CRUD (default channels: #general, #production, #bugs)
- [x] Custom channel create/rename/delete
- [x] Message send with persistence (PostgreSQL)
- [x] Error linking in messages (linkedErrorId field)
- [x] Message history with pagination
- [x] WebSocket real-time message broker (ChatBroadcaster)

### Enhancements (Done — 2026-03-28)

#### Schema
- [x] Flyway V27: add description, type, is_private to chat_channels
- [x] Flyway V28: add is_edited, is_deleted, is_pinned, edited_at to chat_messages
- [x] Flyway V29: message_reactions table
- [x] Flyway V30: channel_read_receipts table

#### Message Edit & Delete
- [x] PATCH /api/v1/chat/messages/{id} — author only, soft edit
- [x] DELETE /api/v1/chat/messages/{id} — soft delete, author or Admin/Owner

#### Message Reactions
- [x] POST /api/v1/chat/messages/{id}/reactions
- [x] DELETE /api/v1/chat/messages/{id}/reactions/{emoji}
- [x] Duplicate reaction prevention (unique constraint)

#### Message Pinning
- [x] PATCH /api/v1/chat/messages/{id}/pin — toggle
- [x] GET /api/v1/chat/channels/{id}/pinned — list pinned messages

#### Message Search
- [x] GET /api/v1/chat/search?orgId=&q= — ILIKE, min 2 chars, deleted excluded

#### Read Receipts
- [x] PUT /api/v1/chat/channels/{id}/read — upsert receipt

## Notes
- Default channels (#general, #production, #bugs) created via POST /channels/defaults
- Messages sent via REST POST, broadcast to WebSocket subscribers in real-time
- Error linking stores the error group UUID in linkedErrorId column
- @mentions stored as plain text (parsed by frontend)
- Soft delete: content replaced with "[deleted]", is_deleted=true
- Edit: content updated, is_edited=true, edited_at set
- Reactions: unique per (message, user, emoji)
- Read receipts: upsert per (channel, user)
