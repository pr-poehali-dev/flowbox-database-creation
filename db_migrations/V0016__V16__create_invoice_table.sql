CREATE TABLE invoice (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number  TEXT NOT NULL UNIQUE,
  company_id      UUID NOT NULL REFERENCES company(id),
  operational_day DATE NOT NULL,
  subtotal_net    NUMERIC(14,2) NOT NULL DEFAULT 0,
  vat_amount      NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_vat       NUMERIC(14,2) NOT NULL DEFAULT 0,
  delivery_total  NUMERIC(14,2) NOT NULL DEFAULT 0,
  status          invoice_status_enum NOT NULL DEFAULT 'pending',
  due_date        DATE NOT NULL,
  paid_at         TIMESTAMPTZ,
  upd_status      upd_status_enum NOT NULL DEFAULT 'not_sent',
  upd_sent_at     TIMESTAMPTZ,
  pdf_url         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoice_company_id      ON invoice(company_id);
CREATE INDEX idx_invoice_invoice_number  ON invoice(invoice_number);
CREATE INDEX idx_invoice_status          ON invoice(status);
CREATE INDEX idx_invoice_operational_day ON invoice(operational_day);
