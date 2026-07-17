-- RetailIQ SQL Query Bank

-- 1. Total Revenue
SELECT SUM(total_amount) AS total_revenue FROM orders WHERE status != 'cancelled';

-- 2. Revenue by State
SELECT c.state, SUM(o.total_amount) AS revenue FROM orders o JOIN customers c ON o.customer_id = c.customer_id GROUP BY c.state ORDER BY revenue DESC;

-- 3. Top Products
SELECT p.name, SUM(oi.quantity) as sold FROM order_items oi JOIN products p ON oi.product_id = p.product_id GROUP BY p.name ORDER BY sold DESC LIMIT 10;

-- 4. Orders by Month
SELECT TO_CHAR(order_date, 'YYYY-MM') as month, COUNT(*) as orders FROM orders GROUP BY month ORDER BY month;

-- 5. Customer Income Levels
SELECT income_level, COUNT(*) FROM customers GROUP BY income_level;

-- 6. Average Order Value
SELECT AVG(total_amount) FROM orders WHERE status != 'cancelled';

-- 7. Category Revenue
SELECT p.category, SUM(oi.line_total) FROM order_items oi JOIN products p ON oi.product_id = p.product_id GROUP BY p.category;

-- 8. Orders by Status
SELECT status, COUNT(*) FROM orders GROUP BY status;
