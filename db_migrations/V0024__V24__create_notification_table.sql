CREATE TABLE notification (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES "user"(id),
  event_type  notification_event_type_enum NOT NULL,
  channel     notification_channel_enum NOT NULL DEFAULT 'in_app',
  text        TEXT NOT NULL,
  link_type   TEXT,
  link_id     UUID,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at     TIMESTAMPTZ
);

CREATE INDEX idx_notification_user_id    ON notification(user_id);
CREATE INDEX idx_notification_is_read    ON notification(is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notification_event_type ON notification(event_type);
CREATE INDEX idx_notification_created_at ON notification(created_at);
