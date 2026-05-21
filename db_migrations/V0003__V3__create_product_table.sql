CREATE TABLE product (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_name TEXT NOT NULL,
  accounting_name TEXT NOT NULL
);
