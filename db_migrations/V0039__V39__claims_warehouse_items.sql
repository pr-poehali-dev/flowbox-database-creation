-- Рекламации: комментарий клиента при споре, приоритет склада
ALTER TABLE claim
  ADD COLUMN IF NOT EXISTS client_comment  text,
  ADD COLUMN IF NOT EXISTS reject_reason   text,
  ADD COLUMN IF NOT EXISTS return_delivery_id uuid REFERENCES delivery(id);

-- Физический товар на нашем складе (возвращённые единицы)
CREATE TABLE IF NOT EXISTS warehouse_item (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      uuid NOT NULL REFERENCES product(id),
  claim_id        uuid REFERENCES claim(id),
  delivery_id     uuid REFERENCES delivery(id),
  quantity        integer NOT NULL DEFAULT 1,
  condition       text NOT NULL DEFAULT 'unknown',  -- whole, damaged
  condition_photos jsonb,
  stock_status    text NOT NULL DEFAULT 'in_warehouse',
  received_at     timestamptz NOT NULL DEFAULT now(),
  resolved_at     timestamptz,
  notes           text
);
CREATE INDEX IF NOT EXISTS idx_warehouse_item_product ON warehouse_item(product_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_item_status  ON warehouse_item(stock_status);

-- Оповещение при поступлении заказа на товар с приоритетом склада
-- Храним флаг «ожидает решения менеджера»
ALTER TABLE warehouse_item
  ADD COLUMN IF NOT EXISTS priority_check_order_id uuid REFERENCES "order"(id),
  ADD COLUMN IF NOT EXISTS priority_notified_at    timestamptz;
