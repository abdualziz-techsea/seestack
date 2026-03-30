CREATE TABLE chat_channel_members (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID        NOT NULL REFERENCES chat_channels (id) ON DELETE CASCADE,
    user_id    UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    user_name  VARCHAR(255) NOT NULL DEFAULT '',
    joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (channel_id, user_id)
);

CREATE INDEX idx_chat_channel_members_channel ON chat_channel_members (channel_id);
CREATE INDEX idx_chat_channel_members_user    ON chat_channel_members (user_id);
