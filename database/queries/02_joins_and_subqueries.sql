-- RetailIQ SQL Query Bank

-- 1. Customers with Orders > 10000
SELECT first_name, last_name FROM customers WHERE customer_id IN (SELECT customer_id FROM orders WHERE total_amount > 10000);

-- 2. Orders with Payments
SELECT o.order_id, p.payment_method, p.status FROM orders o JOIN payments p ON o.order_id = p.order_id;

-- 3. Products never sold
SELECT name FROM products WHERE product_id NOT IN (SELECT DISTINCT product_id FROM order_items);

-- 4. Revenue with Demographics
SELECT sd.region, SUM(o.total_amount) FROM orders o JOIN customers c ON o.customer_id = c.customer_id JOIN state_demographics sd ON c.state = sd.state GROUP BY sd.region;

-- 5. Customers from high literacy states
SELECT COUNT(c.customer_id) FROM customers c JOIN state_demographics sd ON c.state = sd.state WHERE sd.literacy_rate > 80;

-- 6. Average discount by brand
SELECT p.brand, AVG(oi.discount_pct) FROM order_items oi JOIN products p ON oi.product_id = p.product_id GROUP BY p.brand;

-- 7. Returned items revenue loss
SELECT SUM(r.refund_amount) FROM returns r JOIN orders o ON r.order_id = o.order_id;

-- 8. Payments by status
SELECT status, COUNT(*), SUM(amount) FROM payments GROUP BY status;
