-- RetailIQ SQL Query Bank

-- 1. RFM Score calculation (base metrics)
SELECT customer_id, MAX(order_date) as last_order, COUNT(order_id) as frequency, SUM(total_amount) as monetary FROM orders GROUP BY customer_id;

-- 2. CLV basic
SELECT customer_id, SUM(total_amount) as clv FROM orders GROUP BY customer_id ORDER BY clv DESC;

-- 3. Repeat customer rate
SELECT (SELECT COUNT(*) FROM (SELECT customer_id FROM orders GROUP BY customer_id HAVING COUNT(*) > 1) t)::float / (SELECT COUNT(DISTINCT customer_id) FROM orders) as repeat_rate;

-- 4. Top customers by state
SELECT c.state, c.first_name, SUM(o.total_amount) as rev FROM customers c JOIN orders o ON c.customer_id = o.customer_id GROUP BY c.state, c.first_name ORDER BY c.state, rev DESC;

-- 5. Churn indicators (no orders in 6 months)
SELECT c.customer_id FROM customers c WHERE c.customer_id NOT IN (SELECT customer_id FROM orders WHERE order_date > CURRENT_DATE - 180);

-- 6. Average customer lifespan
SELECT AVG(last_order - first_order) FROM (SELECT customer_id, MAX(order_date) as last_order, MIN(order_date) as first_order FROM orders GROUP BY customer_id) t;

-- 7. Revenue by gender
SELECT c.gender, SUM(o.total_amount) FROM customers c JOIN orders o ON c.customer_id = o.customer_id GROUP BY c.gender;

-- 8. High income segment value
SELECT SUM(total_amount) FROM orders o JOIN customers c ON o.customer_id=c.customer_id WHERE c.income_level = 'Premium';
