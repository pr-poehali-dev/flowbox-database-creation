ALTER TABLE product
  ADD COLUMN supplier_id UUID REFERENCES supplier(id),
  ADD COLUMN supplier_article TEXT,
  ADD COLUMN category_ozon TEXT,
  ADD COLUMN category_ym TEXT,
  ADD COLUMN product_type product_type_enum NOT NULL DEFAULT 'standard',
  ADD COLUMN brand TEXT,
  ADD COLUMN description TEXT,
  ADD COLUMN attributes JSONB,
  ADD COLUMN photos JSONB;
