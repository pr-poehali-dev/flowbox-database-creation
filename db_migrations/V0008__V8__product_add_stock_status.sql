ALTER TABLE product
  ADD COLUMN stock_status stock_status_enum NOT NULL DEFAULT 'active',
  ADD COLUMN stock_updated_at TIMESTAMPTZ;
