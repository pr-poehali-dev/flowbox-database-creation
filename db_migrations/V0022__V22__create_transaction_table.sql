CREATE TABLE transaction (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       UUID NOT NULL REFERENCES company(id),
  type             transaction_type_enum NOT NULL,
  amount           NUMERIC(14,2) NOT NULL,
  linked_doc_type  TEXT NOT NULL,
  linked_doc_id    UUID NOT NULL,
  status           transaction_status_enum NOT NULL DEFAULT 'pending',
  created_by       transaction_created_by_enum NOT NULL DEFAULT 'system',
  comment          TEXT,
  balance_after    NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transaction_company_id   ON transaction(company_id);
CREATE INDEX idx_transaction_type         ON transaction(type);
CREATE INDEX idx_transaction_status       ON transaction(status);
CREATE INDEX idx_transaction_linked_doc   ON transaction(linked_doc_type, linked_doc_id);
