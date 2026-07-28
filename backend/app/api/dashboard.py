"""
RetailIQ Backend System
File: dashboard.py
Purpose: Provides backend business logic, API routing, or database models for the RetailIQ platform.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.dependencies import get_db, get_current_user

router = APIRouter()

INTERVAL_MAP = {
    '12h': "INTERVAL '12 hours'",
    '24h': "INTERVAL '24 hours'",
    '7d': "INTERVAL '7 days'",
    '30d': "INTERVAL '30 days'",
    '3m': "INTERVAL '3 months'",
    '6m': "INTERVAL '6 months'",
    '1y': "INTERVAL '1 year'",
    '2y': "INTERVAL '2 years'",
    'all': "INTERVAL '100 years'"
}

@router.get("/stats")
def get_dashboard_stats(interval: str = '30d', db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    interval_sql = INTERVAL_MAP.get(interval, "INTERVAL '30 days'")
    
    q = text(f"""
        SELECT
            SUM(oi.line_total) FILTER (WHERE o.status != 'cancelled' AND o.order_date >= CURRENT_TIMESTAMP - {interval_sql}) as total_revenue,
            SUM(oi.line_total - (p.cost_price * oi.quantity)) FILTER (WHERE o.status != 'cancelled' AND o.order_date >= CURRENT_TIMESTAMP - {interval_sql}) as total_profit,
            COUNT(DISTINCT o.order_id) FILTER (WHERE o.status != 'cancelled' AND o.order_date >= CURRENT_TIMESTAMP - {interval_sql}) as total_orders,
            (SELECT COUNT(*) FROM customers WHERE join_date >= CURRENT_TIMESTAMP - {interval_sql}) as total_customers,
            (SELECT COUNT(*) FROM products WHERE is_active = true) as total_products
        FROM orders o
        LEFT JOIN order_items oi ON o.order_id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.product_id
    """)
    row = db.execute(q).fetchone()
    
    total_revenue = float(row.total_revenue or 0)
    total_profit = float(row.total_profit or 0)

    # Growth compared to previous identical period
    growth_q = text(f"""
        SELECT
            SUM(oi.line_total) FILTER (
                WHERE o.order_date >= CURRENT_TIMESTAMP - {interval_sql}
            ) as rev_this_period,
            SUM(oi.line_total) FILTER (
                WHERE o.order_date >= CURRENT_TIMESTAMP - {interval_sql} * 2
                  AND o.order_date < CURRENT_TIMESTAMP - {interval_sql}
            ) as rev_last_period,
            SUM(oi.line_total - (p.cost_price * oi.quantity)) FILTER (
                WHERE o.order_date >= CURRENT_TIMESTAMP - {interval_sql}
            ) as prof_this_period,
            SUM(oi.line_total - (p.cost_price * oi.quantity)) FILTER (
                WHERE o.order_date >= CURRENT_TIMESTAMP - {interval_sql} * 2
                  AND o.order_date < CURRENT_TIMESTAMP - {interval_sql}
            ) as prof_last_period,
            COUNT(DISTINCT o.order_id) FILTER (
                WHERE o.order_date >= CURRENT_TIMESTAMP - {interval_sql}
            ) as orders_this_period,
            COUNT(DISTINCT o.order_id) FILTER (
                WHERE o.order_date >= CURRENT_TIMESTAMP - {interval_sql} * 2
                  AND o.order_date < CURRENT_TIMESTAMP - {interval_sql}
            ) as orders_last_period,
            (SELECT COUNT(*) FROM customers WHERE join_date >= CURRENT_TIMESTAMP - {interval_sql}) as cust_this_period,
            (SELECT COUNT(*) FROM customers WHERE join_date >= CURRENT_TIMESTAMP - {interval_sql} * 2 AND join_date < CURRENT_TIMESTAMP - {interval_sql}) as cust_last_period
        FROM orders o
        LEFT JOIN order_items oi ON o.order_id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.product_id
        WHERE o.status != 'cancelled'
    """)
    growth = db.execute(growth_q).fetchone()
    
    def calc_growth(this_val, last_val):
        if not last_val:
            return 100.0 if this_val else 0.0
        return round(((this_val - last_val) / last_val) * 100, 1)

    revenue_growth = calc_growth(float(growth.rev_this_period or 0), float(growth.rev_last_period or 0))
    profit_growth = calc_growth(float(growth.prof_this_period or 0), float(growth.prof_last_period or 0))
    orders_growth = calc_growth(float(growth.orders_this_period or 0), float(growth.orders_last_period or 0))
    customers_growth = calc_growth(float(growth.cust_this_period or 0), float(growth.cust_last_period or 0))

    return {
        "total_revenue": total_revenue,
        "total_profit": total_profit,
        "total_orders": int(row.total_orders or 0),
        "total_customers": int(row.total_customers or 0),
        "total_products": int(row.total_products or 0),
        "revenue_growth": revenue_growth,
        "profit_growth": profit_growth,
        "orders_growth": orders_growth,
        "customers_growth": customers_growth,
    }

# Alias for any legacy calls
@router.get("/summary")
def get_dashboard_summary(interval: str = '30d', db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return get_dashboard_stats(interval, db, current_user)

@router.get("/charts")
def get_dashboard_charts(interval: str = '30d', db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    interval_sql = INTERVAL_MAP.get(interval, "INTERVAL '30 days'")
    
    # Revenue Trend
    if interval in ['12h', '24h']:
        # By hour
        rev_q = text(f"""
            SELECT TO_CHAR(DATE_TRUNC('hour', o.order_date), 'HH24:00') as date,
                   DATE_TRUNC('hour', o.order_date) as actual_date,
                   SUM(oi.line_total) as revenue,
                   SUM(oi.line_total - (p.cost_price * oi.quantity)) as profit
            FROM orders o
            JOIN order_items oi ON o.order_id = oi.order_id
            JOIN products p ON oi.product_id = p.product_id
            WHERE o.status != 'cancelled'
              AND o.order_date >= CURRENT_TIMESTAMP - {interval_sql}
            GROUP BY TO_CHAR(DATE_TRUNC('hour', o.order_date), 'HH24:00'), DATE_TRUNC('hour', o.order_date)
            ORDER BY actual_date
        """)
    elif interval in ['7d', '30d']:
        # By day
        rev_q = text(f"""
            SELECT TO_CHAR(o.order_date, 'DD Mon') as date,
                   DATE_TRUNC('day', o.order_date) as actual_date,
                   SUM(oi.line_total) as revenue,
                   SUM(oi.line_total - (p.cost_price * oi.quantity)) as profit
            FROM orders o
            JOIN order_items oi ON o.order_id = oi.order_id
            JOIN products p ON oi.product_id = p.product_id
            WHERE o.status != 'cancelled'
              AND o.order_date >= CURRENT_TIMESTAMP - {interval_sql}
            GROUP BY TO_CHAR(o.order_date, 'DD Mon'), DATE_TRUNC('day', o.order_date)
            ORDER BY actual_date
        """)
    else:
        # By month
        rev_q = text(f"""
            SELECT TO_CHAR(DATE_TRUNC('month', o.order_date), 'Mon YYYY') as date,
                   DATE_TRUNC('month', o.order_date) as actual_date,
                   SUM(oi.line_total) as revenue,
                   SUM(oi.line_total - (p.cost_price * oi.quantity)) as profit
            FROM orders o
            JOIN order_items oi ON o.order_id = oi.order_id
            JOIN products p ON oi.product_id = p.product_id
            WHERE o.status != 'cancelled'
              AND o.order_date >= CURRENT_TIMESTAMP - {interval_sql}
            GROUP BY TO_CHAR(DATE_TRUNC('month', o.order_date), 'Mon YYYY'), DATE_TRUNC('month', o.order_date)
            ORDER BY actual_date
        """)

    rev_rows = db.execute(rev_q).fetchall()
    revenue_trend = [{"date": r.date, "revenue": float(r.revenue or 0), "profit": float(r.profit or 0)} for r in rev_rows]

    # Category Sales
    cat_q = text(f"""
        SELECT p.category, SUM(oi.line_total) as sales
        FROM order_items oi
        JOIN products p ON oi.product_id = p.product_id
        JOIN orders o ON oi.order_id = o.order_id
        WHERE o.status != 'cancelled'
          AND o.order_date >= CURRENT_TIMESTAMP - {interval_sql}
        GROUP BY p.category ORDER BY sales DESC LIMIT 6
    """)
    cat_rows = db.execute(cat_q).fetchall()
    category_sales = [{"category": r.category, "sales": float(r.sales or 0)} for r in cat_rows]

    # Payment Methods
    pay_q = text(f"""
        SELECT payment_method as method, COUNT(*) as count, SUM(amount) as total_amount
        FROM payments p
        JOIN orders o ON p.order_id = o.order_id
        WHERE p.status = 'completed'
          AND o.order_date >= CURRENT_TIMESTAMP - {interval_sql}
        GROUP BY payment_method
    """)
    pay_rows = db.execute(pay_q).fetchall()
    payment_methods = [{"name": r.method.replace('_', ' ').title(), "value": float(r.total_amount or 0)} for r in pay_rows]

    # Regional Sales (Treemap expects name and size)
    reg_q = text(f"""
        SELECT shipping_state as state, SUM(total_amount) as sales
        FROM orders
        WHERE status != 'cancelled'
          AND order_date >= CURRENT_TIMESTAMP - {interval_sql}
        GROUP BY shipping_state
        ORDER BY sales DESC
    """)
    reg_rows = db.execute(reg_q).fetchall()
    regional_sales = [{"name": r.state, "size": float(r.sales or 0)} for r in reg_rows]

    # Order Status for Funnel
    status_q = text(f"""
        SELECT status, COUNT(*) as count
        FROM orders
        WHERE order_date >= CURRENT_TIMESTAMP - {interval_sql}
        GROUP BY status
    """)
    status_rows = db.execute(status_q).fetchall()
    order_status = [{"name": r.status.title(), "value": int(r.count)} for r in status_rows]

    return {
        "revenueTrend": revenue_trend, 
        "categorySales": category_sales,
        "paymentMethods": payment_methods,
        "regionalSales": regional_sales,
        "orderStatus": order_status
    }
