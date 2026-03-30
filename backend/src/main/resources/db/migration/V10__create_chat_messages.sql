CREATE TABLE chat_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id      UUID NOT NULL REFERENCES chat_channels (id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users (id)         ON DELETE CASCADE,
  content         TEXT NOT NULL,
  linked_error_id UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_channel_id ON chat_messages (channel_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages (created_at DESC);
