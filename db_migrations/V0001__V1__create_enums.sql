CREATE TYPE product_type_enum AS ENUM ('standard', 'oversized');
CREATE TYPE stock_status_enum AS ENUM ('active','suspended','in_warehouse','ready_for_sale','ready_for_return','returned_to_supplier','written_off');
CREATE TYPE moderation_status_ozon_enum AS ENUM ('draft','pending','approved','rejected');
CREATE TYPE product_bundle_status_enum AS ENUM ('active','zeroed','suspended');
CREATE TYPE marketplace_enum AS ENUM ('ozon','yandex_market');
