-- ═══════════════════════════════════════════════════════════════════════════════
-- RetailIQ Platform — Database Views
-- Pre-computed analytical views for dashboard and reporting
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- v_order_details — Denormalized order view with full context
-- Joins orders, order_items, customers, products for easy querying
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_order_details AS
SELECT
    o.order_id,
    o.order_date,
    o.status AS order_status,
    o.total_amount AS order_total,

    -- Customer info
    c.customer_id,
    c.first_name || ' ' || c.last_name AS customer_name,
    c.city AS customer_city,
    c.state AS customer_state,
    c.income_level,
    c.gender,
    c.age,

    -- Product info
    p.product_id,
    p.name AS product_name,
    p.category,
    p.sub_category,
    p.brand,
    p.price AS list_price,
    p.cost_price,

    -- Order item details
    oi.quantity,
    oi.unit_price,
    oi.discount_pct,
    oi.line_total AS revenue,
    (oi.line_total - (p.cost_price * oi.quantity)) AS profit,

    -- Temporal dimensions
    EXTRACT(YEAR FROM o.order_date) AS order_year,
    EXTRACT(MONTH FROM o.order_date) AS order_month,
    EXTRACT(QUARTER FROM o.order_date) AS order_quarter,
    TO_CHAR(o.order_date, 'YYYY-MM') AS year_month,
    CASE WHEN EXTRACT(DOW FROM o.order_date) IN (0, 6) THEN TRUE ELSE FALSE END AS is_weekend,
    CASE
        WHEN EXTRACT(MONTH FROM o.order_date) IN (10, 11) THEN TRUE
        ELSE FALSE
    END AS is_festival_season

FROM orders o
JOIN order_items oi ON o.order_id = oi.order_id
JOIN customers c ON o.customer_id = c.customer_id
JOIN products p ON oi.product_id = p.product_id
WHERE o.status NOT IN ('cancelled');

COMMENT ON VIEW v_order_details IS 'Denormalized order view with customer, product, and temporal dimensions';

-- ─────────────────────────────────────────────────────────────────────────────
-- v_revenue_by_month — Monthly revenue aggregation
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_revenue_by_month AS
SELECT
    TO_CHAR(o.order_date, 'YYYY-MM') AS year_month,
    EXTRACT(YEAR FROM o.order_date)::INTEGER AS year,
    EXTRACT(MONTH FROM o.order_date)::INTEGER AS month,
    COUNT(DISTINCT o.order_id) AS total_orders,
    COUNT(DISTINCT o.customer_id) AS unique_customers,
    SUM(oi.line_total) AS total_revenue,
    SUM(oi.line_total - (p.cost_price * oi.quantity)) AS total_profit,
    ROUND(AVG(o.total_amount), 2) AS avg_order_value,
    SUM(oi.quantity) AS total_units_sold
FROM orders o
JOIN order_items oi ON o.order_id = oi.order_id
JOIN products p ON oi.product_id = p.product_id
WHERE o.status NOT IN ('cancelled')
GROUP BY TO_CHAR(o.order_date, 'YYYY-MM'),
         EXTRACT(YEAR FROM o.order_date),
         EXTRACT(MONTH FROM o.order_date)
ORDER BY year_month;

COMMENT ON VIEW v_revenue_by_month IS 'Monthly aggregated revenue metrics';

-- ─────────────────────────────────────────────────────────────────────────────
-- v_product_performance — Product-level metrics
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_product_performance AS
SELECT
    p.product_id,
    p.name AS product_name,
    p.category,
    p.sub_category,
    p.brand,
    p.price AS list_price,
    p.cost_price,
    COUNT(DISTINCT oi.order_id) AS total_orders,
    SUM(oi.quantity) AS total_units_sold,
    SUM(oi.line_total) AS total_revenue,
    SUM(oi.line_total - (p.cost_price * oi.quantity)) AS total_profit,
    ROUND(AVG(oi.discount_pct), 2) AS avg_discount,
    ROUND(
        (SUM(oi.line_total - (p.cost_price * oi.quantity)) / NULLIF(SUM(oi.line_total), 0)) * 100,
        2
    ) AS profit_margin_pct,
    MIN(o.order_date) AS first_sale_date,
    MAX(o.order_date) AS last_sale_date
FROM products p
LEFT JOIN order_items oi ON p.product_id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.order_id AND o.status NOT IN ('cancelled')
GROUP BY p.product_id, p.name, p.category, p.sub_category, p.brand, p.price, p.cost_price
ORDER BY total_revenue DESC NULLS LAST;

COMMENT ON VIEW v_product_performance IS 'Product-level sales and profitability metrics';

-- ─────────────────────────────────────────────────────────────────────────────
-- v_customer_rfm — RFM (Recency, Frequency, Monetary) scores
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_customer_rfm AS
WITH customer_metrics AS (
    SELECT
        c.customer_id,
        c.first_name || ' ' || c.last_name AS customer_name,
        c.state,
        c.income_level,
        (CURRENT_DATE - MAX(o.order_date)) AS recency_days,
        COUNT(DISTINCT o.order_id) AS frequency,
        COALESCE(SUM(o.total_amount), 0) AS monetary
    FROM customers c
    LEFT JOIN orders o ON c.customer_id = o.customer_id AND o.status NOT IN ('cancelled')
    GROUP BY c.customer_id, c.first_name, c.last_name, c.state, c.income_level
),
rfm_scores AS (
    SELECT
        *,
        NTILE(5) OVER (ORDER BY recency_days DESC) AS r_score,
        NTILE(5) OVER (ORDER BY frequency ASC) AS f_score,
        NTILE(5) OVER (ORDER BY monetary ASC) AS m_score
    FROM customer_metrics
    WHERE frequency > 0
)
SELECT
    *,
    r_score + f_score + m_score AS rfm_total,
    CASE
        WHEN r_score >= 4 AND f_score >= 4 AND m_score >= 4 THEN 'Champions'
        WHEN r_score >= 3 AND f_score >= 3 AND m_score >= 3 THEN 'Loyal Customers'
        WHEN r_score >= 4 AND f_score <= 2 THEN 'New Customers'
        WHEN r_score <= 2 AND f_score >= 3 AND m_score >= 3 THEN 'At Risk'
        WHEN r_score <= 2 AND f_score <= 2 THEN 'Lost'
        ELSE 'Potential Loyalists'
    END AS segment
FROM rfm_scores;

COMMENT ON VIEW v_customer_rfm IS 'Customer RFM segmentation with quintile-based scoring';

-- ─────────────────────────────────────────────────────────────────────────────
-- v_inventory_status — Current inventory health with risk assessment
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_inventory_status AS
SELECT
    i.inventory_id,
    i.warehouse_id,
    w.name AS warehouse_name,
    w.city AS warehouse_city,
    w.state AS warehouse_state,
    i.product_id,
    p.name AS product_name,
    p.category,
    p.brand,
    i.stock_quantity,
    i.reorder_level,
    i.safety_stock,
    i.last_restocked,
    CASE
        WHEN i.stock_quantity = 0 THEN 'Out of Stock'
        WHEN i.stock_quantity <= i.safety_stock THEN 'Critical'
        WHEN i.stock_quantity <= i.reorder_level THEN 'Low Stock'
        WHEN i.stock_quantity > i.reorder_level * 3 THEN 'Overstock'
        ELSE 'Optimal'
    END AS stock_status,
    GREATEST(i.reorder_level - i.stock_quantity, 0) AS units_to_reorder
FROM inventory i
JOIN warehouses w ON i.warehouse_id = w.warehouse_id
JOIN products p ON i.product_id = p.product_id
ORDER BY
    CASE
        WHEN i.stock_quantity = 0 THEN 1
        WHEN i.stock_quantity <= i.safety_stock THEN 2
        WHEN i.stock_quantity <= i.reorder_level THEN 3
        ELSE 4
    END,
    i.stock_quantity ASC;

COMMENT ON VIEW v_inventory_status IS 'Current inventory health with stock status classification';

-- ─────────────────────────────────────────────────────────────────────────────
-- v_state_performance — State-level analytics
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_state_performance AS
SELECT
    sd.state,
    sd.region,
    sd.population,
    sd.literacy_rate,
    sd.per_capita_income,
    COUNT(DISTINCT c.customer_id) AS total_customers,
    COUNT(DISTINCT o.order_id) AS total_orders,
    COALESCE(SUM(oi.line_total), 0) AS total_revenue,
    COALESCE(SUM(oi.line_total - (p.cost_price * oi.quantity)), 0) AS total_profit,
    ROUND(COALESCE(AVG(o.total_amount), 0), 2) AS avg_order_value,
    ROUND(COALESCE(SUM(oi.line_total), 0) / NULLIF(sd.population, 0) * 1000000, 2)
        AS revenue_per_million_pop
FROM state_demographics sd
LEFT JOIN customers c ON sd.state = c.state
LEFT JOIN orders o ON c.customer_id = o.customer_id AND o.status NOT IN ('cancelled')
LEFT JOIN order_items oi ON o.order_id = oi.order_id
LEFT JOIN products p ON oi.product_id = p.product_id
GROUP BY sd.state, sd.region, sd.population, sd.literacy_rate, sd.per_capita_income
ORDER BY total_revenue DESC;

COMMENT ON VIEW v_state_performance IS 'State-level revenue and performance metrics with demographic context';
