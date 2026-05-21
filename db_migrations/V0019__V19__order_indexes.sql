CREATE INDEX idx_order_company_id      ON "order"(company_id);
CREATE INDEX idx_order_order_status    ON "order"(order_status);
CREATE INDEX idx_order_operational_day ON "order"(operational_day);
CREATE INDEX idx_order_payment_status  ON "order"(payment_status);
CREATE INDEX idx_order_invoice_id      ON "order"(invoice_id);
CREATE INDEX idx_order_active          ON "order"(archived_at) WHERE archived_at IS NULL;
