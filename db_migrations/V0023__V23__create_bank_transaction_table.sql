CREATE TABLE bank_transaction (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_operation_id  TEXT NOT NULL UNIQUE,
  direction          bank_direction_enum NOT NULL,
  counterparty_inn   TEXT NOT NULL,
  company_id         UUID REFERENCES company(id),
  supplier_id        UUID REFERENCES supplier(id),
  amount             NUMERIC(14,2) NOT NULL,
  payment_purpose    TEXT NOT NULL,
  invoice_number     TEXT,
  match_status       bank_match_status_enum NOT NULL DEFAULT 'unmatched',
  matched_by         UUID REFERENCES "user"(id),
  source             bank_source_enum NOT NULL DEFAULT 'polling',
  received_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bank_transaction_company_id       ON bank_transaction(company_id);
CREATE INDEX idx_bank_transaction_match_status     ON bank_transaction(match_status);
CREATE INDEX idx_bank_transaction_bank_operation_id ON bank_transaction(bank_operation_id);
CREATE INDEX idx_bank_transaction_supplier_id      ON bank_transaction(supplier_id);
CREATE INDEX idx_bank_transaction_received_at      ON bank_transaction(received_at);
