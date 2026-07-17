-- RetailIQ SQL Query Bank

-- 1. EXPLAIN ANALYZE example
EXPLAIN ANALYZE SELECT * FROM orders WHERE status = 'pending';

-- 2. Cross-tabulation (mocked via case)
SELECT category, SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) as completed, SUM(CASE WHEN status='returned' THEN 1 ELSE 0 END) as returned FROM products p JOIN order_items oi ON p.product_id=oi.product_id JOIN orders o ON oi.order_id=o.order_id GROUP BY category;

-- 3. Payment method distribution
SELECT payment_method, COUNT(*) * 100.0 / (SELECT COUNT(*) FROM payments) as pct FROM payments GROUP BY payment_method;

-- 4. Return reasons by category
SELECT p.category, r.reason, COUNT(*) FROM returns r JOIN products p ON r.product_id = p.product_id GROUP BY p.category, r.reason;

-- 5. Call stored procedure (total update)
SELECT sp_update_order_totals();

-- 6. Call stored procedure (low stock)
SELECT sp_check_low_stock();

-- 7. Seasonal patterns
SELECT EXTRACT(MONTH FROM order_date) as m, SUM(total_amount) FROM orders GROUP BY m ORDER BY m;

-- 8. Refund impact on revenue
SELECT (SELECT SUM(refund_amount) FROM returns) / (SELECT SUM(total_amount) FROM orders) * 100 as refund_pct;
