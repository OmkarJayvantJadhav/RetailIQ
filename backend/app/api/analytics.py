from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.dependencies import get_db, get_current_user

router = APIRouter()

@router.get("/sales")
def get_sales_analytics(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    # Monthly revenue trend (last 12 months)
    trend_q = text("""
        SELECT TO_CHAR(order_date, 'Mon YYYY') as month,
               EXTRACT(YEAR FROM order_date) as yr,
               EXTRACT(MONTH FROM order_date) as mo,
               SUM(total_amount) as revenue,
               COUNT(order_id) as orders
        FROM orders
        WHERE status != 'cancelled'
          AND order_date >= CURRENT_DATE - INTERVAL '12 months'
        GROUP BY TO_CHAR(order_date, 'Mon YYYY'), EXTRACT(YEAR FROM order_date), EXTRACT(MONTH FROM order_date)
        ORDER BY yr, mo
    """)
    trend_rows = db.execute(trend_q).fetchall()
    revenue_trend = [{"month": r.month, "revenue": float(r.revenue), "orders": int(r.orders)} for r in trend_rows]

    # Top 10 products by revenue
    top_products_q = text("""
        SELECT p.name, p.category, SUM(oi.line_total) as revenue, SUM(oi.quantity) as units
        FROM order_items oi
        JOIN products p ON oi.product_id = p.product_id
        JOIN orders o ON oi.order_id = o.order_id
        WHERE o.status != 'cancelled'
        GROUP BY p.name, p.category
        ORDER BY revenue DESC
        LIMIT 10
    """)
    top_products_rows = db.execute(top_products_q).fetchall()
    top_products = [{"name": r.name, "category": r.category, "revenue": float(r.revenue), "units": int(r.units)} for r in top_products_rows]

    # Category breakdown
    category_q = text("""
        SELECT p.category, SUM(oi.line_total) as revenue, SUM(oi.quantity) as units,
               COUNT(DISTINCT o.order_id) as orders
        FROM order_items oi
        JOIN products p ON oi.product_id = p.product_id
        JOIN orders o ON oi.order_id = o.order_id
        WHERE o.status != 'cancelled'
        GROUP BY p.category
        ORDER BY revenue DESC
    """)
    cat_rows = db.execute(category_q).fetchall()
    category_sales = [{"category": r.category, "revenue": float(r.revenue), "units": int(r.units), "orders": int(r.orders)} for r in cat_rows]

    # Subcategory breakdown
    subcategory_q = text("""
        SELECT p.sub_category, p.category, SUM(oi.line_total) as revenue, SUM(oi.quantity) as units,
               COUNT(DISTINCT o.order_id) as orders
        FROM order_items oi
        JOIN products p ON oi.product_id = p.product_id
        JOIN orders o ON oi.order_id = o.order_id
        WHERE o.status != 'cancelled'
        GROUP BY p.sub_category, p.category
        ORDER BY revenue DESC
    """)
    sub_rows = db.execute(subcategory_q).fetchall()
    subcategory_sales = [{"subcategory": r.sub_category, "category": r.category, "revenue": float(r.revenue), "units": int(r.units), "orders": int(r.orders)} for r in sub_rows]

    # Order status distribution
    status_q = text("""
        SELECT status, COUNT(*) as count FROM orders GROUP BY status ORDER BY count DESC
    """)
    status_rows = db.execute(status_q).fetchall()
    order_status = [{"status": r.status, "count": int(r.count)} for r in status_rows]

    return {
        "revenue_trend": revenue_trend,
        "top_products": top_products,
        "category_sales": category_sales,
        "subcategory_sales": subcategory_sales,
        "order_status": order_status,
    }


@router.get("/customers")
def get_customer_analytics(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    # RFM Segments
    rfm_q = text("""
        WITH rfm AS (
            SELECT
                c.customer_id,
                CURRENT_DATE - MAX(o.order_date) as recency,
                COUNT(o.order_id) as frequency,
                SUM(o.total_amount) as monetary
            FROM customers c
            JOIN orders o ON c.customer_id = o.customer_id
            WHERE o.status != 'cancelled'
            GROUP BY c.customer_id
        ),
        rfm_scored AS (
            SELECT *,
                CASE WHEN recency <= 30 THEN 'Champions'
                     WHEN recency <= 60 AND frequency >= 5 THEN 'Loyal Customers'
                     WHEN recency <= 90 THEN 'Potential Loyalists'
                     WHEN recency > 180 AND frequency <= 2 THEN 'At Risk'
                     WHEN recency > 270 THEN 'Lost Customers'
                     ELSE 'Promising'
                END as segment
            FROM rfm
        )
        SELECT segment, COUNT(*) as count,
               AVG(monetary) as avg_monetary,
               AVG(frequency) as avg_frequency
        FROM rfm_scored
        GROUP BY segment
        ORDER BY count DESC
    """)
    rfm_rows = db.execute(rfm_q).fetchall()
    rfm_segments = [{"segment": r.segment, "count": int(r.count),
                     "avg_monetary": round(float(r.avg_monetary), 2),
                     "avg_frequency": round(float(r.avg_frequency), 2)} for r in rfm_rows]

    # Top customers by CLV (lifetime value)
    clv_q = text("""
        SELECT c.customer_id, c.first_name || ' ' || c.last_name as name,
               c.city, c.state, c.income_level,
               COUNT(o.order_id) as total_orders,
               SUM(o.total_amount) as lifetime_value
        FROM customers c
        JOIN orders o ON c.customer_id = o.customer_id
        WHERE o.status != 'cancelled'
        GROUP BY c.customer_id, c.first_name, c.last_name, c.city, c.state, c.income_level
        ORDER BY lifetime_value DESC
        LIMIT 10
    """)
    clv_rows = db.execute(clv_q).fetchall()
    top_customers = [{"id": r.customer_id, "name": r.name, "city": r.city,
                      "state": r.state, "income_level": r.income_level,
                      "orders": int(r.total_orders), "clv": round(float(r.lifetime_value), 2)} for r in clv_rows]

    # Income level distribution
    income_q = text("""
        SELECT c.income_level, SUM(o.total_amount) as revenue, COUNT(DISTINCT c.customer_id) as customers
        FROM customers c JOIN orders o ON c.customer_id = o.customer_id
        WHERE o.status != 'cancelled'
        GROUP BY c.income_level ORDER BY revenue DESC
    """)
    income_rows = db.execute(income_q).fetchall()
    income_distribution = [{"income_level": r.income_level, "revenue": float(r.revenue), "customers": int(r.customers)} for r in income_rows]

    return {
        "rfm_segments": rfm_segments,
        "top_customers": top_customers,
        "income_distribution": income_distribution,
    }


@router.get("/market")
def get_market_analytics(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    # Revenue by state
    state_q = text("""
        SELECT o.shipping_state as state,
               SUM(o.total_amount) as revenue,
               COUNT(DISTINCT o.customer_id) as customers,
               COUNT(o.order_id) as orders,
               AVG(o.total_amount) as aov
        FROM orders o
        WHERE o.status != 'cancelled' AND o.shipping_state IS NOT NULL
        GROUP BY o.shipping_state
        ORDER BY revenue DESC
    """)
    state_rows = db.execute(state_q).fetchall()
    state_revenue = [{"state": r.state, "revenue": float(r.revenue),
                      "customers": int(r.customers), "orders": int(r.orders),
                      "aov": round(float(r.aov), 2)} for r in state_rows]

    # Revenue by city (top 10)
    city_q = text("""
        SELECT o.shipping_city as city, o.shipping_state as state,
               SUM(o.total_amount) as revenue, COUNT(o.order_id) as orders
        FROM orders o
        WHERE o.status != 'cancelled' AND o.shipping_city IS NOT NULL
        GROUP BY o.shipping_city, o.shipping_state
        ORDER BY revenue DESC
    """)
    city_rows = db.execute(city_q).fetchall()
    city_revenue = [{"city": r.city, "state": r.state,
                     "revenue": float(r.revenue), "orders": int(r.orders)} for r in city_rows]

    return {"state_revenue": state_revenue, "city_revenue": city_revenue}


@router.get("/inventory")
def get_inventory_analytics(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    # Stockout risk — items where stock_quantity < reorder_level
    stockout_q = text("""
        SELECT p.name as product_name, p.category, i.warehouse_id,
               i.stock_quantity, i.reorder_level, i.safety_stock,
               ROUND((i.stock_quantity::numeric / NULLIF(i.reorder_level, 0)) * 100, 1) as stock_pct
        FROM inventory i
        JOIN products p ON i.product_id = p.product_id
        WHERE i.stock_quantity <= i.reorder_level
        ORDER BY stock_pct ASC
        LIMIT 20
    """)
    stockout_rows = db.execute(stockout_q).fetchall()
    stockout_risk = [{"product": r.product_name, "category": r.category,
                      "warehouse": r.warehouse_id, "stock": int(r.stock_quantity),
                      "reorder_level": int(r.reorder_level),
                      "stock_pct": float(r.stock_pct) if r.stock_pct else 0} for r in stockout_rows]

    # ABC Analysis by revenue contribution
    abc_q = text("""
        WITH product_revenue AS (
            SELECT p.product_id, p.name, p.category,
                   SUM(oi.line_total) as revenue
            FROM order_items oi
            JOIN products p ON oi.product_id = p.product_id
            GROUP BY p.product_id, p.name, p.category
        ),
        ranked AS (
            SELECT *, SUM(revenue) OVER () as total_revenue,
                   SUM(revenue) OVER (ORDER BY revenue DESC) as cumulative_revenue
            FROM product_revenue
        )
        SELECT name, category, revenue,
               ROUND((cumulative_revenue / total_revenue) * 100, 2) as cumulative_pct,
               CASE WHEN (cumulative_revenue / total_revenue) <= 0.8 THEN 'A'
                    WHEN (cumulative_revenue / total_revenue) <= 0.95 THEN 'B'
                    ELSE 'C'
               END as abc_class
        FROM ranked ORDER BY revenue DESC
    """)
    abc_rows = db.execute(abc_q).fetchall()
    abc_analysis = [{"name": r.name, "category": r.category,
                     "revenue": float(r.revenue), "cumulative_pct": float(r.cumulative_pct),
                     "class": r.abc_class} for r in abc_rows]

    # Summary counts
    summary_q = text("""
        SELECT
            COUNT(*) as total_items,
            SUM(CASE WHEN stock_quantity = 0 THEN 1 ELSE 0 END) as out_of_stock,
            SUM(CASE WHEN stock_quantity <= reorder_level AND stock_quantity > 0 THEN 1 ELSE 0 END) as low_stock,
            SUM(CASE WHEN stock_quantity > reorder_level * 5 THEN 1 ELSE 0 END) as overstock
        FROM inventory
    """)
    summary = db.execute(summary_q).fetchone()

    return {
        "stockout_risk": stockout_risk,
        "abc_analysis": abc_analysis,
        "summary": {
            "total_items": int(summary.total_items),
            "out_of_stock": int(summary.out_of_stock),
            "low_stock": int(summary.low_stock),
            "overstock": int(summary.overstock),
        }
    }


@router.get("/recommendations")
def get_recommendations(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    recs = []

    # Check stockout risk
    stockout_count_q = text("SELECT COUNT(*) FROM inventory WHERE stock_quantity <= reorder_level")
    stockout_count = db.execute(stockout_count_q).scalar()
    if stockout_count > 0:
        recs.append({
            "type": "critical",
            "category": "Inventory",
            "title": f"{stockout_count} Products at Stockout Risk",
            "description": f"{stockout_count} SKUs have stock at or below their reorder level. Immediate restocking recommended to prevent revenue loss.",
            "action": "Review Inventory Analytics → Stockout Risk tab",
            "impact": "High"
        })

    # Check dead inventory
    dead_q = text("""
        SELECT COUNT(*) FROM inventory i
        WHERE i.stock_quantity > 0
          AND i.product_id NOT IN (
              SELECT DISTINCT product_id FROM order_items oi
              JOIN orders o ON oi.order_id = o.order_id
              WHERE o.order_date >= CURRENT_DATE - INTERVAL '90 days'
          )
    """)
    dead_count = db.execute(dead_q).scalar()
    if dead_count > 0:
        recs.append({
            "type": "warning",
            "category": "Inventory",
            "title": f"{dead_count} Dead Inventory SKUs Detected",
            "description": f"{dead_count} products have not been ordered in 90+ days but still hold stock. Consider markdown promotions or clearance.",
            "action": "Run clearance sale or redistribute to high-demand warehouses",
            "impact": "Medium"
        })

    # Top category recommendation
    top_cat_q = text("""
        SELECT p.category, SUM(oi.line_total) as revenue
        FROM order_items oi JOIN products p ON oi.product_id = p.product_id
        JOIN orders o ON oi.order_id = o.order_id
        WHERE o.status != 'cancelled' GROUP BY p.category ORDER BY revenue DESC LIMIT 1
    """)
    top_cat = db.execute(top_cat_q).fetchone()
    if top_cat:
        recs.append({
            "type": "success",
            "category": "Sales Strategy",
            "title": f"Double Down on {top_cat.category}",
            "description": f"{top_cat.category} is your highest-revenue category at ₹{top_cat.revenue:,.0f}. Consider expanding the product range, running targeted promotions, and increasing warehouse allocation for this category.",
            "action": "Expand catalog and run category-specific campaigns",
            "impact": "High"
        })

    # High-value customer retention
    recs.append({
        "type": "info",
        "category": "Customer Retention",
        "title": "Re-engage At-Risk High-Value Customers",
        "description": "Customers in the 'At Risk' RFM segment with high lifetime value should be targeted with personalized offers, loyalty discounts, and re-engagement email campaigns before they churn.",
        "action": "Export At-Risk segment from Customer Analytics and run CRM campaign",
        "impact": "Medium"
    })

    recs.append({
        "type": "info",
        "category": "Market Expansion",
        "title": "Target Tier-2 Cities with Underperforming Revenue",
        "description": "Geographic analysis shows states in Central India have lower revenue despite comparable populations. Regional promotions, vernacular marketing, and logistics optimization can unlock this market.",
        "action": "Launch region-specific discount codes for Central India states",
        "impact": "Medium"
    })

    return {"recommendations": recs, "total": len(recs)}
