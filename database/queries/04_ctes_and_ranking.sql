-- RetailIQ SQL Query Bank

-- 1. High value customers CTE
WITH hvc AS (SELECT customer_id FROM orders GROUP BY customer_id HAVING SUM(total_amount) > 50000) SELECT * FROM customers WHERE customer_id IN (SELECT customer_id FROM hvc);

-- 2. Product revenue ranking CTE
WITH prod_rev AS (SELECT product_id, SUM(line_total) as rev FROM order_items GROUP BY product_id) SELECT p.name, pr.rev FROM products p JOIN prod_rev pr ON p.product_id = pr.product_id ORDER BY pr.rev DESC;

-- 3. Active users
WITH active AS (SELECT user_id FROM audit_logs WHERE timestamp > CURRENT_DATE - 30) SELECT username FROM users WHERE user_id IN (SELECT user_id FROM active);

-- 4. Regional performance
WITH reg_rev AS (SELECT sd.region, SUM(o.total_amount) as rev FROM orders o JOIN customers c ON o.customer_id=c.customer_id JOIN state_demographics sd ON c.state=sd.state GROUP BY sd.region) SELECT region, rev, RANK() OVER(ORDER BY rev DESC) FROM reg_rev;

-- 5. Multi-step CTE for inventory
WITH low AS (SELECT product_id FROM inventory WHERE stock_quantity < reorder_level), sales AS (SELECT product_id, COUNT(*) as cnt FROM order_items GROUP BY product_id) SELECT l.product_id, s.cnt FROM low l JOIN sales s ON l.product_id = s.product_id;

-- 6. Running total CTE
WITH daily AS (SELECT order_date, SUM(total_amount) as total FROM orders GROUP BY order_date) SELECT order_date, total, SUM(total) OVER(ORDER BY order_date) FROM daily;

-- 7. Best selling categories
WITH cat_rev AS (SELECT category, SUM(price) as rev FROM products GROUP BY category) SELECT * FROM cat_rev ORDER BY rev DESC;

-- 8. Customer retention CTE
WITH first_order AS (SELECT customer_id, MIN(order_date) as f_date FROM orders GROUP BY customer_id) SELECT TO_CHAR(f_date, 'YYYY-MM'), COUNT(*) FROM first_order GROUP BY 1;
