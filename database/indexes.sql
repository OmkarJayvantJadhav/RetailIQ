-- ═══════════════════════════════════════════════════════════════════════════════
-- RetailIQ Platform — Performance Indexes
-- Optimized for common query patterns in retail analytics
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── Customers ────────────────────────────────────────────────────────────────
CREATE INDEX idx_customers_state ON customers(state);
CREATE INDEX idx_customers_city ON customers(city);
CREATE INDEX idx_customers_income ON customers(income_level);
CREATE INDEX idx_customers_join_date ON customers(join_date);
CREATE INDEX idx_customers_active ON customers(is_active) WHERE is_active = TRUE;

-- ── Products ─────────────────────────────────────────────────────────────────
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_active ON products(is_active) WHERE is_active = TRUE;

-- ── Orders ───────────────────────────────────────────────────────────────────
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_date ON orders(order_date);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_date_status ON orders(order_date, status);
CREATE INDEX idx_orders_customer_date ON orders(customer_id, order_date);

-- ── Order Items ──────────────────────────────────────────────────────────────
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
CREATE INDEX idx_order_items_order_product ON order_items(order_id, product_id);

-- ── Inventory ────────────────────────────────────────────────────────────────
CREATE INDEX idx_inventory_warehouse ON inventory(warehouse_id);
CREATE INDEX idx_inventory_product ON inventory(product_id);
CREATE INDEX idx_inventory_low_stock ON inventory(stock_quantity, reorder_level)
    WHERE stock_quantity <= reorder_level;

-- ── Returns ──────────────────────────────────────────────────────────────────
CREATE INDEX idx_returns_order ON returns(order_id);
CREATE INDEX idx_returns_product ON returns(product_id);
CREATE INDEX idx_returns_date ON returns(return_date);
CREATE INDEX idx_returns_status ON returns(status);

-- ── Payments ─────────────────────────────────────────────────────────────────
CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_method ON payments(payment_method);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_payments_status ON payments(status);

-- ── Notifications ────────────────────────────────────────────────────────────
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- ── Audit Logs ───────────────────────────────────────────────────────────────
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_table ON audit_logs(table_name);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_action ON audit_logs(action);

-- ═══════════════════════════════════════════════════════════════════════════════
-- EXPLAIN ANALYZE Examples — Verify index usage
-- ═══════════════════════════════════════════════════════════════════════════════

-- Example 1: Verify index on orders by date
-- EXPLAIN ANALYZE SELECT * FROM orders WHERE order_date BETWEEN '2024-01-01' AND '2024-03-31';

-- Example 2: Verify index on low stock inventory
-- EXPLAIN ANALYZE SELECT * FROM inventory WHERE stock_quantity <= reorder_level;

-- Example 3: Verify composite index on order_items
-- EXPLAIN ANALYZE SELECT oi.*, p.name, p.category
-- FROM order_items oi JOIN products p ON oi.product_id = p.product_id
-- WHERE oi.order_id = 1000;

-- Example 4: Verify unread notifications index
-- EXPLAIN ANALYZE SELECT * FROM notifications WHERE user_id = 1 AND is_read = FALSE;
