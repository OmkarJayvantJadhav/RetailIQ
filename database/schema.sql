-- ═══════════════════════════════════════════════════════════════════════════════
-- RetailIQ Platform — Database Schema
-- Enterprise Retail Analytics & Demand Forecasting Platform
-- PostgreSQL 15 | Normalized to 3NF | 12 Tables
-- ═══════════════════════════════════════════════════════════════════════════════

-- Drop existing tables (in reverse dependency order)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS returns CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS warehouses CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS state_demographics CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. STATE_DEMOGRAPHICS — Reference table for Indian states
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE state_demographics (
    state           VARCHAR(100)    PRIMARY KEY,
    population      BIGINT          NOT NULL,
    literacy_rate   DECIMAL(5, 2)   CHECK (literacy_rate BETWEEN 0 AND 100),
    per_capita_income DECIMAL(12, 2) CHECK (per_capita_income > 0),
    region          VARCHAR(50)     NOT NULL CHECK (region IN ('North', 'South', 'East', 'West', 'Central'))
);

COMMENT ON TABLE state_demographics IS 'Reference data for Indian states with population and economic indicators';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. USERS — Application users (admin, analyst, viewer)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE users (
    user_id         SERIAL          PRIMARY KEY,
    username        VARCHAR(100)    UNIQUE NOT NULL,
    email           VARCHAR(255)    UNIQUE NOT NULL,
    hashed_password VARCHAR(255)    NOT NULL,
    full_name       VARCHAR(200),
    role            VARCHAR(20)     NOT NULL DEFAULT 'viewer'
                                    CHECK (role IN ('admin', 'analyst', 'viewer')),
    is_active       BOOLEAN         DEFAULT TRUE,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    last_login      TIMESTAMP
);

COMMENT ON TABLE users IS 'Application users with role-based access control';

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. CUSTOMERS — Retail customers across India
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE customers (
    customer_id     SERIAL          PRIMARY KEY,
    first_name      VARCHAR(100)    NOT NULL,
    last_name       VARCHAR(100)    NOT NULL,
    email           VARCHAR(255),
    phone           VARCHAR(20),
    age             INTEGER         CHECK (age BETWEEN 18 AND 90),
    gender          VARCHAR(10)     CHECK (gender IN ('Male', 'Female', 'Other')),
    city            VARCHAR(100)    NOT NULL,
    state           VARCHAR(100)    NOT NULL REFERENCES state_demographics(state),
    income_level    VARCHAR(20)     NOT NULL
                                    CHECK (income_level IN ('Low', 'Medium', 'High', 'Premium')),
    join_date       DATE            NOT NULL,
    is_active       BOOLEAN         DEFAULT TRUE
);

COMMENT ON TABLE customers IS 'Retail customers with demographics and location data';

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. PRODUCTS — Product catalog
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE products (
    product_id      SERIAL          PRIMARY KEY,
    name            VARCHAR(255)    NOT NULL,
    category        VARCHAR(100)    NOT NULL,
    sub_category    VARCHAR(100),
    brand           VARCHAR(100),
    price           DECIMAL(10, 2)  NOT NULL CHECK (price > 0),
    cost_price      DECIMAL(10, 2)  CHECK (cost_price > 0),
    is_active       BOOLEAN         DEFAULT TRUE,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE products IS 'Product catalog with pricing and categorization';

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. WAREHOUSES — Distribution centers across India
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE warehouses (
    warehouse_id    VARCHAR(20)     PRIMARY KEY,
    name            VARCHAR(255)    NOT NULL,
    city            VARCHAR(100)    NOT NULL,
    state           VARCHAR(100)    NOT NULL REFERENCES state_demographics(state),
    capacity        INTEGER         NOT NULL CHECK (capacity > 0),
    manager_name    VARCHAR(200),
    is_active       BOOLEAN         DEFAULT TRUE
);

COMMENT ON TABLE warehouses IS 'Distribution and fulfillment centers';

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. ORDERS — Customer orders
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE orders (
    order_id        SERIAL          PRIMARY KEY,
    customer_id     INTEGER         NOT NULL REFERENCES customers(customer_id),
    order_date      DATE            NOT NULL,
    status          VARCHAR(20)     DEFAULT 'completed'
                                    CHECK (status IN ('pending', 'processing', 'shipped',
                                                      'delivered', 'completed', 'cancelled')),
    shipping_city   VARCHAR(100),
    shipping_state  VARCHAR(100),
    total_amount    DECIMAL(12, 2)  DEFAULT 0 CHECK (total_amount >= 0),
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE orders IS 'Customer orders with status tracking';

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. ORDER_ITEMS — Line items within orders (normalizes many-to-many)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE order_items (
    order_item_id   SERIAL          PRIMARY KEY,
    order_id        INTEGER         NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    product_id      INTEGER         NOT NULL REFERENCES products(product_id),
    quantity        INTEGER         NOT NULL CHECK (quantity > 0),
    unit_price      DECIMAL(10, 2)  NOT NULL CHECK (unit_price > 0),
    discount_pct    DECIMAL(5, 2)   DEFAULT 0 CHECK (discount_pct BETWEEN 0 AND 100),
    line_total      DECIMAL(12, 2)  GENERATED ALWAYS AS
                                    (quantity * unit_price * (1 - discount_pct / 100)) STORED
);

COMMENT ON TABLE order_items IS 'Individual line items within an order';

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. INVENTORY — Warehouse stock levels per product
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE inventory (
    inventory_id    SERIAL          PRIMARY KEY,
    warehouse_id    VARCHAR(20)     NOT NULL REFERENCES warehouses(warehouse_id),
    product_id      INTEGER         NOT NULL REFERENCES products(product_id),
    stock_quantity  INTEGER         NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    reorder_level   INTEGER         NOT NULL DEFAULT 10 CHECK (reorder_level >= 0),
    safety_stock    INTEGER         DEFAULT 5 CHECK (safety_stock >= 0),
    last_restocked  DATE,
    UNIQUE(warehouse_id, product_id)
);

COMMENT ON TABLE inventory IS 'Current stock levels per product per warehouse';

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. RETURNS — Product returns and refunds
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE returns (
    return_id       SERIAL          PRIMARY KEY,
    order_id        INTEGER         NOT NULL REFERENCES orders(order_id),
    product_id      INTEGER         NOT NULL REFERENCES products(product_id),
    return_date     DATE            NOT NULL,
    reason          VARCHAR(100)    CHECK (reason IN ('Defective', 'Wrong Size', 'Changed Mind',
                                                      'Wrong Item', 'Damaged in Transit',
                                                      'Quality Issue', 'Other')),
    refund_amount   DECIMAL(10, 2)  CHECK (refund_amount >= 0),
    status          VARCHAR(20)     DEFAULT 'pending'
                                    CHECK (status IN ('pending', 'approved', 'rejected', 'refunded'))
);

COMMENT ON TABLE returns IS 'Product return requests with reason tracking';

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. PAYMENTS — Payment transactions
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE payments (
    payment_id      SERIAL          PRIMARY KEY,
    order_id        INTEGER         NOT NULL REFERENCES orders(order_id),
    payment_date    TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    amount          DECIMAL(12, 2)  NOT NULL CHECK (amount > 0),
    payment_method  VARCHAR(50)     NOT NULL
                                    CHECK (payment_method IN ('credit_card', 'debit_card',
                                                               'upi', 'net_banking', 'cod', 'wallet')),
    status          VARCHAR(20)     DEFAULT 'completed'
                                    CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    transaction_id  VARCHAR(100)    UNIQUE
);

COMMENT ON TABLE payments IS 'Payment transactions linked to orders';

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. NOTIFICATIONS — System alerts and notifications
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE notifications (
    notification_id SERIAL          PRIMARY KEY,
    user_id         INTEGER         REFERENCES users(user_id) ON DELETE SET NULL,
    title           VARCHAR(255)    NOT NULL,
    message         TEXT            NOT NULL,
    type            VARCHAR(30)     CHECK (type IN ('stockout_alert', 'forecast_alert',
                                                     'system', 'info', 'warning', 'critical')),
    is_read         BOOLEAN         DEFAULT FALSE,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    related_entity  VARCHAR(50),
    related_entity_id INTEGER
);

COMMENT ON TABLE notifications IS 'System notifications and alerts for users';

-- ─────────────────────────────────────────────────────────────────────────────
-- 12. AUDIT_LOGS — Track all data modifications
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE audit_logs (
    log_id          SERIAL          PRIMARY KEY,
    user_id         INTEGER         REFERENCES users(user_id) ON DELETE SET NULL,
    action          VARCHAR(50)     NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE',
                                                                'LOGIN', 'LOGOUT', 'EXPORT',
                                                                'UPLOAD', 'RETRAIN')),
    table_name      VARCHAR(100)    NOT NULL,
    record_id       INTEGER,
    old_values      JSONB,
    new_values      JSONB,
    ip_address      VARCHAR(45),
    timestamp       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE audit_logs IS 'Complete audit trail of all data modifications';

-- ═══════════════════════════════════════════════════════════════════════════════
-- Schema creation complete — 12 tables
-- ═══════════════════════════════════════════════════════════════════════════════
