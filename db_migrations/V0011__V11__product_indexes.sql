CREATE INDEX idx_product_supplier_id            ON product(supplier_id);
CREATE INDEX idx_product_stock_status           ON product(stock_status);
CREATE INDEX idx_product_moderation_status_ozon ON product(moderation_status_ozon);
CREATE INDEX idx_product_category_ozon          ON product(category_ozon);
CREATE INDEX idx_product_active                 ON product(archived_at) WHERE archived_at IS NULL;
