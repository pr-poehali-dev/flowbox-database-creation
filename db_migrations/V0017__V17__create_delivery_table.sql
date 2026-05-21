CREATE TABLE delivery (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  logist_id           UUID REFERENCES "user"(id),
  supplier_id         UUID REFERENCES supplier(id),
  type                delivery_type_enum NOT NULL,
  delivery_method     delivery_method_enum NOT NULL,
  fulfillment_scheme  TEXT,
  rfbs_subtype        TEXT,
  route_points        JSONB,
  total_boxes         INTEGER NOT NULL DEFAULT 0,
  labels_pdf          TEXT,
  act_pdf             TEXT,
  transfer_act_pdf    TEXT,
  ttn_id              TEXT,
  tracking_number     TEXT,
  status              delivery_status_enum NOT NULL DEFAULT 'new',
  reject_reason       TEXT,
  task_date           DATE NOT NULL,
  shipped_at          TIMESTAMPTZ,
  delivered_at        TIMESTAMPTZ
);

CREATE INDEX idx_delivery_logist_id   ON delivery(logist_id);
CREATE INDEX idx_delivery_supplier_id ON delivery(supplier_id);
CREATE INDEX idx_delivery_status      ON delivery(status);
CREATE INDEX idx_delivery_task_date   ON delivery(task_date);
