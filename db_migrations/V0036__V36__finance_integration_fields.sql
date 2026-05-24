-- Добавляем поля для интеграции с банком Точка и финансового блока

-- company: баланс переплаты + статус блокировки системой
ALTER TABLE company
  ADD COLUMN IF NOT EXISTS balance            numeric(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS blocked_system_at  timestamptz,
  ADD COLUMN IF NOT EXISTS operational_day_close_time text NOT NULL DEFAULT '22:00';

-- bank_transaction: дата операции из банка
ALTER TABLE bank_transaction
  ADD COLUMN IF NOT EXISTS operation_date     timestamptz,
  ADD COLUMN IF NOT EXISTS invoice_id         uuid REFERENCES invoice(id),
  ADD COLUMN IF NOT EXISTS matched_invoice_id uuid REFERENCES invoice(id),
  ADD COLUMN IF NOT EXISTS matched_at         timestamptz;

-- invoice: PDF в S3, UPD поля, привязка к bank_transaction
ALTER TABLE invoice
  ADD COLUMN IF NOT EXISTS bank_transaction_id uuid REFERENCES bank_transaction(id),
  ADD COLUMN IF NOT EXISTS overpayment_amount  numeric(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS balance_applied     numeric(14,2) NOT NULL DEFAULT 0;

-- настройки платформы (время закрытия дня, папка 1С)
CREATE TABLE IF NOT EXISTS platform_setting (
  key   text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO platform_setting (key, value) VALUES
  ('operational_day_close_time', '22:00'),
  ('business_days_due', '5'),
  ('export_1c_path', '/tmp/1c_exchange')
ON CONFLICT DO NOTHING;

-- Индексы для производительности поиска
CREATE INDEX IF NOT EXISTS idx_bank_tx_operation_id ON bank_transaction(bank_operation_id);
CREATE INDEX IF NOT EXISTS idx_invoice_number       ON invoice(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoice_status       ON invoice(status);
CREATE INDEX IF NOT EXISTS idx_invoice_due_date     ON invoice(due_date) WHERE status IN ('pending', 'overdue');
CREATE INDEX IF NOT EXISTS idx_order_payment_status ON "order"(payment_status) WHERE archived_at IS NULL;
