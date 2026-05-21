CREATE TABLE claim (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_number         TEXT NOT NULL UNIQUE,
  company_id           UUID NOT NULL REFERENCES company(id),
  order_id             UUID REFERENCES "order"(id),
  product_id           UUID REFERENCES product(id),
  type                 claim_type_enum NOT NULL,
  source               claim_source_enum NOT NULL DEFAULT 'manual',
  description          TEXT,
  photos               JSONB,
  decision             TEXT,
  compensation_amount  NUMERIC(14,2) NOT NULL DEFAULT 0,
  compensation_type    claim_compensation_type_enum,
  status               claim_status_enum NOT NULL DEFAULT 'new',
  manager_id           UUID REFERENCES "user"(id),
  history              JSONB NOT NULL DEFAULT '[]',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at            TIMESTAMPTZ
);

CREATE INDEX idx_claim_company_id  ON claim(company_id);
CREATE INDEX idx_claim_order_id    ON claim(order_id);
CREATE INDEX idx_claim_product_id  ON claim(product_id);
CREATE INDEX idx_claim_status      ON claim(status);
CREATE INDEX idx_claim_manager_id  ON claim(manager_id);
