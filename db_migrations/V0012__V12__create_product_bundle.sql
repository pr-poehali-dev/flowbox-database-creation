CREATE TABLE product_bundle (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_name       TEXT NOT NULL,
  accounting_name  TEXT NOT NULL,
  items            JSONB NOT NULL DEFAULT '[]',
  purchase_price   NUMERIC(14,2) NOT NULL DEFAULT 0,
  our_price        NUMERIC(14,2) GENERATED ALWAYS AS (ROUND(purchase_price * 1.08, 2)) STORED,
  stock_available  INTEGER NOT NULL DEFAULT 0,
  status           product_bundle_status_enum NOT NULL DEFAULT 'active',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at      TIMESTAMPTZ
);

CREATE INDEX idx_product_bundle_status ON product_bundle(status);
CREATE INDEX idx_product_bundle_active ON product_bundle(archived_at) WHERE archived_at IS NULL;
