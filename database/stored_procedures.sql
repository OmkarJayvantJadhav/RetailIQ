-- ═══════════════════════════════════════════════════════════════════════════════
-- RetailIQ Platform — Stored Procedures & Functions
-- Reusable business logic in PostgreSQL
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- sp_update_order_totals
-- Recalculates order total_amount from its line items
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION sp_update_order_totals(p_order_id INTEGER DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER := 0;
BEGIN
    IF p_order_id IS NOT NULL THEN
        -- Update a specific order
        UPDATE orders o
        SET total_amount = sub.total
        FROM (
            SELECT order_id, COALESCE(SUM(line_total), 0) AS total
            FROM order_items
            WHERE order_id = p_order_id
            GROUP BY order_id
        ) sub
        WHERE o.order_id = sub.order_id
          AND o.order_id = p_order_id;
        GET DIAGNOSTICS updated_count = ROW_COUNT;
    ELSE
        -- Update all orders
        UPDATE orders o
        SET total_amount = sub.total
        FROM (
            SELECT order_id, COALESCE(SUM(line_total), 0) AS total
            FROM order_items
            GROUP BY order_id
        ) sub
        WHERE o.order_id = sub.order_id
          AND o.total_amount != sub.total;
        GET DIAGNOSTICS updated_count = ROW_COUNT;
    END IF;

    RAISE NOTICE 'Updated % order totals', updated_count;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION sp_update_order_totals IS 'Recalculate order totals from order_items. Pass NULL to update all.';

-- ─────────────────────────────────────────────────────────────────────────────
-- sp_check_low_stock
-- Generates notifications for products below reorder level
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION sp_check_low_stock()
RETURNS INTEGER AS $$
DECLARE
    alert_count INTEGER := 0;
    inv RECORD;
BEGIN
    FOR inv IN
        SELECT
            i.warehouse_id,
            i.product_id,
            i.stock_quantity,
            i.reorder_level,
            p.name AS product_name,
            w.name AS warehouse_name
        FROM inventory i
        JOIN products p ON i.product_id = p.product_id
        JOIN warehouses w ON i.warehouse_id = w.warehouse_id
        WHERE i.stock_quantity <= i.reorder_level
          AND i.stock_quantity > 0
          AND NOT EXISTS (
              SELECT 1 FROM notifications n
              WHERE n.type = 'stockout_alert'
                AND n.related_entity = 'inventory'
                AND n.related_entity_id = i.inventory_id
                AND n.created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
          )
    LOOP
        INSERT INTO notifications (title, message, type, related_entity, related_entity_id)
        VALUES (
            'Low Stock Alert: ' || inv.product_name,
            FORMAT('Product "%s" at warehouse "%s" has only %s units (reorder level: %s). Consider restocking immediately.',
                   inv.product_name, inv.warehouse_name, inv.stock_quantity, inv.reorder_level),
            'stockout_alert',
            'inventory',
            inv.product_id
        );
        alert_count := alert_count + 1;
    END LOOP;

    -- Also check for completely out-of-stock items
    FOR inv IN
        SELECT
            i.warehouse_id,
            i.product_id,
            p.name AS product_name,
            w.name AS warehouse_name
        FROM inventory i
        JOIN products p ON i.product_id = p.product_id
        JOIN warehouses w ON i.warehouse_id = w.warehouse_id
        WHERE i.stock_quantity = 0
          AND NOT EXISTS (
              SELECT 1 FROM notifications n
              WHERE n.type = 'stockout_alert'
                AND n.related_entity = 'inventory'
                AND n.related_entity_id = i.inventory_id
                AND n.created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
          )
    LOOP
        INSERT INTO notifications (title, message, type, related_entity, related_entity_id)
        VALUES (
            'CRITICAL: Out of Stock — ' || inv.product_name,
            FORMAT('Product "%s" is OUT OF STOCK at warehouse "%s". Immediate restocking required to prevent revenue loss.',
                   inv.product_name, inv.warehouse_name),
            'critical',
            'inventory',
            inv.product_id
        );
        alert_count := alert_count + 1;
    END LOOP;

    RAISE NOTICE 'Generated % low stock alerts', alert_count;
    RETURN alert_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION sp_check_low_stock IS 'Scan inventory for low/out-of-stock items and generate notifications';

-- ─────────────────────────────────────────────────────────────────────────────
-- sp_monthly_revenue_summary
-- Returns monthly revenue summary for a given date range
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION sp_monthly_revenue_summary(
    p_start_date DATE DEFAULT '2022-01-01',
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
    year_month      TEXT,
    total_orders    BIGINT,
    unique_customers BIGINT,
    total_revenue   NUMERIC,
    total_profit    NUMERIC,
    avg_order_value NUMERIC,
    mom_growth_pct  NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH monthly AS (
        SELECT
            TO_CHAR(o.order_date, 'YYYY-MM') AS ym,
            COUNT(DISTINCT o.order_id) AS orders,
            COUNT(DISTINCT o.customer_id) AS customers,
            SUM(oi.line_total) AS revenue,
            SUM(oi.line_total - (p.cost_price * oi.quantity)) AS profit,
            ROUND(AVG(o.total_amount), 2) AS aov
        FROM orders o
        JOIN order_items oi ON o.order_id = oi.order_id
        JOIN products p ON oi.product_id = p.product_id
        WHERE o.order_date BETWEEN p_start_date AND p_end_date
          AND o.status NOT IN ('cancelled')
        GROUP BY TO_CHAR(o.order_date, 'YYYY-MM')
        ORDER BY ym
    )
    SELECT
        m.ym,
        m.orders,
        m.customers,
        m.revenue,
        m.profit,
        m.aov,
        ROUND(
            (m.revenue - LAG(m.revenue) OVER (ORDER BY m.ym))
            / NULLIF(LAG(m.revenue) OVER (ORDER BY m.ym), 0) * 100,
            2
        ) AS growth
    FROM monthly m;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION sp_monthly_revenue_summary IS 'Monthly revenue summary with MoM growth for a date range';

-- ─────────────────────────────────────────────────────────────────────────────
-- sp_customer_retention_cohort
-- Calculates customer retention cohorts by join month
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION sp_customer_retention_cohort()
RETURNS TABLE(
    cohort_month    TEXT,
    cohort_size     BIGINT,
    month_number    INTEGER,
    retained        BIGINT,
    retention_pct   NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH cohorts AS (
        SELECT
            c.customer_id,
            TO_CHAR(c.join_date, 'YYYY-MM') AS cohort,
            TO_CHAR(o.order_date, 'YYYY-MM') AS order_month
        FROM customers c
        JOIN orders o ON c.customer_id = o.customer_id
        WHERE o.status NOT IN ('cancelled')
    ),
    cohort_sizes AS (
        SELECT cohort, COUNT(DISTINCT customer_id) AS size
        FROM cohorts
        GROUP BY cohort
    ),
    cohort_activity AS (
        SELECT
            cohort,
            (EXTRACT(YEAR FROM TO_DATE(order_month, 'YYYY-MM')) * 12
             + EXTRACT(MONTH FROM TO_DATE(order_month, 'YYYY-MM'))
             - EXTRACT(YEAR FROM TO_DATE(cohort, 'YYYY-MM')) * 12
             - EXTRACT(MONTH FROM TO_DATE(cohort, 'YYYY-MM')))::INTEGER AS mn,
            COUNT(DISTINCT customer_id) AS active_customers
        FROM cohorts
        GROUP BY cohort, mn
    )
    SELECT
        ca.cohort,
        cs.size,
        ca.mn,
        ca.active_customers,
        ROUND(ca.active_customers::NUMERIC / cs.size * 100, 2)
    FROM cohort_activity ca
    JOIN cohort_sizes cs ON ca.cohort = cs.cohort
    ORDER BY ca.cohort, ca.mn;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION sp_customer_retention_cohort IS 'Customer retention cohort analysis by join month';

-- ─────────────────────────────────────────────────────────────────────────────
-- sp_abc_analysis
-- Classifies products into A, B, C categories based on revenue contribution
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION sp_abc_analysis()
RETURNS TABLE(
    product_id      INTEGER,
    product_name    VARCHAR,
    category        VARCHAR,
    total_revenue   NUMERIC,
    revenue_pct     NUMERIC,
    cumulative_pct  NUMERIC,
    abc_class       TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH product_revenue AS (
        SELECT
            p.product_id AS pid,
            p.name AS pname,
            p.category AS pcat,
            COALESCE(SUM(oi.line_total), 0) AS rev
        FROM products p
        LEFT JOIN order_items oi ON p.product_id = oi.product_id
        LEFT JOIN orders o ON oi.order_id = o.order_id AND o.status NOT IN ('cancelled')
        GROUP BY p.product_id, p.name, p.category
        HAVING COALESCE(SUM(oi.line_total), 0) > 0
    ),
    ranked AS (
        SELECT
            pid, pname, pcat, rev,
            ROUND(rev / SUM(rev) OVER () * 100, 4) AS pct,
            ROUND(SUM(rev) OVER (ORDER BY rev DESC) / SUM(rev) OVER () * 100, 4) AS cum_pct
        FROM product_revenue
    )
    SELECT
        r.pid,
        r.pname,
        r.pcat,
        r.rev,
        r.pct,
        r.cum_pct,
        CASE
            WHEN r.cum_pct <= 80 THEN 'A'
            WHEN r.cum_pct <= 95 THEN 'B'
            ELSE 'C'
        END
    FROM ranked r
    ORDER BY r.rev DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION sp_abc_analysis IS 'ABC inventory classification based on revenue contribution (Pareto principle)';
