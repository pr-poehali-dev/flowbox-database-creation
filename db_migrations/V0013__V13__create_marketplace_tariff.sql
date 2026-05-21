CREATE TABLE marketplace_tariff (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marketplace             marketplace_enum NOT NULL,
  category_name           TEXT NOT NULL,
  product_type            product_type_enum NOT NULL DEFAULT 'standard',
  commission_lt_1500      NUMERIC(6,4) NOT NULL DEFAULT 0,
  commission_1500_5000    NUMERIC(6,4) NOT NULL DEFAULT 0,
  commission_5000_10000   NUMERIC(6,4) NOT NULL DEFAULT 0,
  commission_gt_10000     NUMERIC(6,4) NOT NULL DEFAULT 0,
  acquiring_percent       NUMERIC(6,4) NOT NULL DEFAULT 0.0190,
  service_fee_fixed       NUMERIC(10,2) NOT NULL DEFAULT 20,
  early_payout_standard   NUMERIC(6,4) NOT NULL DEFAULT 0.0490,
  early_payout_ozon_bank  NUMERIC(6,4) NOT NULL DEFAULT 0.0339,
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by              UUID REFERENCES "user"(id)
);

CREATE INDEX idx_marketplace_tariff_marketplace ON marketplace_tariff(marketplace);
CREATE INDEX idx_marketplace_tariff_category    ON marketplace_tariff(category_name);
CREATE INDEX idx_marketplace_tariff_updated_by  ON marketplace_tariff(updated_by);
