-- RetailIQ SQL Query Bank

-- 1. Customer ranking by state
SELECT customer_id, state, total, RANK() OVER(PARTITION BY state ORDER BY total DESC) FROM (SELECT c.customer_id, c.state, SUM(o.total_amount) as total FROM customers c JOIN orders o ON c.customer_id = o.customer_id GROUP BY c.customer_id, c.state) t;

-- 2. Cumulative Revenue
SELECT order_date, SUM(total_amount) OVER (ORDER BY order_date) FROM orders;

-- 3. MoM Growth
SELECT month, rev, (rev - LAG(rev) OVER(ORDER BY month)) / LAG(rev) OVER(ORDER BY month) as growth FROM (SELECT TO_CHAR(order_date, 'YYYY-MM') as month, SUM(total_amount) as rev FROM orders GROUP BY month) t;

-- 4. Top 3 products per category
SELECT category, name, rev FROM (SELECT p.category, p.name, SUM(oi.line_total) as rev, ROW_NUMBER() OVER(PARTITION BY p.category ORDER BY SUM(oi.line_total) DESC) as rn FROM products p JOIN order_items oi ON p.product_id = oi.product_id GROUP BY p.category, p.name) t WHERE rn <= 3;

-- 5. Moving Average
SELECT order_date, AVG(total_amount) OVER(ORDER BY order_date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as ma_7day FROM orders;

-- 6. Percentile Ranking
SELECT customer_id, total, PERCENT_RANK() OVER(ORDER BY total) FROM (SELECT customer_id, SUM(total_amount) as total FROM orders GROUP BY customer_id) t;

-- 7. Lead analysis
SELECT order_date, total_amount, LEAD(total_amount) OVER(ORDER BY order_date) as next_day FROM orders;

-- 8. Dense Rank states
SELECT state, rev, DENSE_RANK() OVER(ORDER BY rev DESC) FROM (SELECT c.state, SUM(o.total_amount) as rev FROM customers c JOIN orders o ON c.customer_id = o.customer_id GROUP BY c.state) t;
