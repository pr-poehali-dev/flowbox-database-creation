ALTER TABLE product
  ADD COLUMN dim_assembled_l NUMERIC(10,3),
  ADD COLUMN dim_assembled_w NUMERIC(10,3),
  ADD COLUMN dim_assembled_h NUMERIC(10,3),
  ADD COLUMN dim_assembled_kg NUMERIC(10,3),
  ADD COLUMN dim_package_l NUMERIC(10,3),
  ADD COLUMN dim_package_w NUMERIC(10,3),
  ADD COLUMN dim_package_h NUMERIC(10,3),
  ADD COLUMN dim_package_kg NUMERIC(10,3),
  ADD COLUMN package_places INTEGER DEFAULT 1;
