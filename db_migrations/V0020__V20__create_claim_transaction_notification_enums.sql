CREATE TYPE claim_type_enum AS ENUM ('delivery_refusal','return','defect','damage');
CREATE TYPE claim_source_enum AS ENUM ('ozon_api','manual');
CREATE TYPE claim_compensation_type_enum AS ENUM ('money','part_replacement','back_to_stock','write_off','return_to_supplier');
CREATE TYPE claim_status_enum AS ENUM ('new','reviewing','decision_made','agreed','disputed','procedural','closed');

CREATE TYPE transaction_type_enum AS ENUM ('invoice_issued','payment_received','compensation_accrued','compensation_paid','balance_used');
CREATE TYPE transaction_status_enum AS ENUM ('completed','pending','cancelled');
CREATE TYPE transaction_created_by_enum AS ENUM ('system','manager');

CREATE TYPE bank_direction_enum AS ENUM ('incoming','outgoing');
CREATE TYPE bank_match_status_enum AS ENUM ('auto_matched','overpayment','underpayment','needs_distribution','manual_matched','unmatched');
CREATE TYPE bank_source_enum AS ENUM ('webhook','polling');

CREATE TYPE notification_channel_enum AS ENUM ('in_app','email');
CREATE TYPE notification_event_type_enum AS ENUM (
  'new_order','order_confirmed','order_cancelled','delivery_status',
  'invoice_issued','invoice_paid','payment_overdue','auto_blocked',
  'new_claim','claim_resolved','stock_zero','logist_task',
  'edo_unsigned','payment_needs_distribution'
);
