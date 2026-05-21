CREATE TYPE invoice_status_enum AS ENUM ('pending','paid','overdue','cancelled');
CREATE TYPE upd_status_enum     AS ENUM ('not_sent','sent','signed','overdue');
CREATE TYPE delivery_type_enum  AS ENUM ('to_buyer','to_tc','return_from_buyer','return_to_supplier');
CREATE TYPE delivery_method_enum AS ENUM ('own','ozon_partner_tc','third_party_tc');
CREATE TYPE delivery_status_enum AS ENUM ('new','picked_from_supplier','in_transit','handed_to_tc','delivered','refused');
CREATE TYPE payment_status_enum  AS ENUM ('unpaid','paid');
CREATE TYPE fulfillment_scheme_enum AS ENUM ('rfbs_standard','rfbs_express');
CREATE TYPE order_status_enum    AS ENUM ('new','confirmed','picked_up','in_transit','delivered','cancelled');
