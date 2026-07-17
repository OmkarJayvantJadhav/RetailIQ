-- Phase 2: SQL Query Bank for India Retail Analytics

-- ==========================================
-- 1. BASIC AGGREGATIONS
-- ==========================================

-- 1.1 Revenue by State
SELECT 
    c.state, 
    SUM(o.sales_amount) AS total_revenue,
    COUNT(o.order_id) AS total_orders
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
GROUP BY c.state
ORDER BY total_revenue DESC;

-- 1.2 Revenue by Product Category
SELECT 
    p.category, 
    SUM(o.sales_amount) AS total_revenue,
    SUM(o.quantity) AS total_items_sold
FROM orders o
JOIN products p ON o.product_id = p.product_id
GROUP BY p.category
ORDER BY total_revenue DESC;

-- ==========================================
-- 2. INTERMEDIATE QUERIES (JOINS & GROUPS)
-- ==========================================

-- 2.1 Top 10 Products by Revenue
SELECT 
    p.product_id, 
    p.category,
    p.sub_category,
    SUM(o.sales_amount) AS revenue
FROM orders o
JOIN products p ON o.product_id = p.product_id
GROUP BY p.product_id, p.category, p.sub_category
ORDER BY revenue DESC
LIMIT 10;

-- 2.2 Customer Spending by Income Level
SELECT 
    c.income_level,
    COUNT(DISTINCT c.customer_id) as customer_count,
    SUM(o.sales_amount) as total_spend,
    SUM(o.sales_amount) / COUNT(DISTINCT c.customer_id) as avg_spend_per_customer
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
GROUP BY c.income_level
ORDER BY total_spend DESC;

-- 2.3 Order Frequency by Gender
SELECT
    c.gender,
    COUNT(o.order_id) as total_orders,
    SUM(o.sales_amount) as total_revenue
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
GROUP BY c.gender;


-- ==========================================
-- 3. ADVANCED QUERIES (WINDOW FUNCTIONS)
-- ==========================================

-- 3.1 Running (Cumulative) Monthly Revenue
SELECT
  DATE_TRUNC('month', order_date) AS month,
  SUM(sales_amount) AS monthly_revenue,
  SUM(SUM(sales_amount)) OVER (ORDER BY DATE_TRUNC('month', order_date)) AS running_revenue
FROM orders
GROUP BY DATE_TRUNC('month', order_date)
ORDER BY month;

-- 3.2 Month-Over-Month Growth
WITH monthly AS (
  SELECT 
    DATE_TRUNC('month', order_date) AS month, 
    SUM(sales_amount) AS revenue
  FROM orders
  GROUP BY DATE_TRUNC('month', order_date)
)
SELECT 
    month, 
    revenue,
    LAG(revenue) OVER (ORDER BY month) AS prev_month_revenue,
    ROUND(100.0 * (revenue - LAG(revenue) OVER (ORDER BY month)) / LAG(revenue) OVER (ORDER BY month), 2) AS pct_growth
FROM monthly
ORDER BY month;

-- 3.3 Customer Ranking by Spend within Each State
SELECT
  c.customer_id, 
  c.state, 
  SUM(o.sales_amount) AS total_spend,
  DENSE_RANK() OVER (PARTITION BY c.state ORDER BY SUM(o.sales_amount) DESC) AS rank_in_state
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
GROUP BY c.customer_id, c.state;

-- ==========================================
-- 4. INVENTORY & RETURNS QUERIES
-- ==========================================

-- 4.1 Stockout Risk (Quantity near/below reorder level)
SELECT
    i.warehouse_id,
    p.category,
    p.brand,
    i.product_id,
    i.stock_quantity,
    i.reorder_level
FROM inventory i
JOIN products p ON i.product_id = p.product_id
WHERE i.stock_quantity <= i.reorder_level + 20
ORDER BY i.stock_quantity ASC
LIMIT 20;

-- 4.2 Most common return reasons
SELECT
    reason,
    COUNT(return_id) as return_count
FROM returns
GROUP BY reason
ORDER BY return_count DESC;

-- 4.3 Return Rate by Category
WITH CategorySales AS (
    SELECT p.category, COUNT(o.order_id) as total_orders
    FROM orders o JOIN products p ON o.product_id = p.product_id
    GROUP BY p.category
),
CategoryReturns AS (
    SELECT p.category, COUNT(r.return_id) as returned_orders
    FROM returns r
    JOIN orders o ON r.order_id = o.order_id
    JOIN products p ON o.product_id = p.product_id
    GROUP BY p.category
)
SELECT 
    s.category,
    s.total_orders,
    COALESCE(r.returned_orders, 0) as returned_orders,
    ROUND(100.0 * COALESCE(r.returned_orders, 0) / s.total_orders, 2) as return_rate_pct
FROM CategorySales s
LEFT JOIN CategoryReturns r ON s.category = r.category
ORDER BY return_rate_pct DESC;
