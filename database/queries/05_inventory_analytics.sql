-- RetailIQ SQL Query Bank

-- 1. Stockout risk
SELECT w.name, p.name, i.stock_quantity, i.reorder_level FROM inventory i JOIN products p ON i.product_id = p.product_id JOIN warehouses w ON i.warehouse_id = w.warehouse_id WHERE i.stock_quantity <= i.reorder_level;

-- 2. ABC Analysis
SELECT product_id, SUM(line_total) as rev, NTILE(3) OVER(ORDER BY SUM(line_total) DESC) as abc_class FROM order_items GROUP BY product_id;

-- 3. Warehouse capacity
SELECT w.name, SUM(i.stock_quantity) as total_stock, w.capacity, (SUM(i.stock_quantity)::float/w.capacity)*100 as utilization FROM warehouses w JOIN inventory i ON w.warehouse_id = i.warehouse_id GROUP BY w.name, w.capacity;

-- 4. Dead stock
SELECT p.name FROM products p WHERE p.product_id NOT IN (SELECT product_id FROM order_items oi JOIN orders o ON oi.order_id=o.order_id WHERE o.order_date > CURRENT_DATE - 90);

-- 5. Overstock
SELECT p.name, i.stock_quantity FROM inventory i JOIN products p ON i.product_id = p.product_id WHERE i.stock_quantity > i.reorder_level * 5;

-- 6. Safety stock analysis
SELECT product_id, stock_quantity, safety_stock FROM inventory WHERE stock_quantity < safety_stock;

-- 7. Inventory turnover estimate
SELECT p.name, (SUM(oi.quantity)::float / MAX(i.stock_quantity)) as turnover FROM products p JOIN order_items oi ON p.product_id = oi.product_id JOIN inventory i ON p.product_id = i.product_id GROUP BY p.name;

-- 8. Restock required
SELECT warehouse_id, COUNT(*) as items_needed FROM inventory WHERE stock_quantity < reorder_level GROUP BY warehouse_id;
