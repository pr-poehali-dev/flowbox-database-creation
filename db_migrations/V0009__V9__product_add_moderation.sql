ALTER TABLE product
  ADD COLUMN moderation_status_ozon moderation_status_ozon_enum NOT NULL DEFAULT 'draft',
  ADD COLUMN ozon_task_id TEXT;
