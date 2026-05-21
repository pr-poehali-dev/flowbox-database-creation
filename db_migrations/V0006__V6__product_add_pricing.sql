ALTER TABLE product
  ADD COLUMN purchase_price_vat NUMERIC(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN purchase_price_net NUMERIC(14,2) GENERATED ALWAYS AS (ROUND(purchase_price_vat / 1.22, 2)) STORED,
  ADD COLUMN our_price NUMERIC(14,2) GENERATED ALWAYS AS (ROUND((purchase_price_vat / 1.22) * 1.08, 2)) STORED;
