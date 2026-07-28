"""
RetailIQ Backend System
File: recommendations.py
Purpose: Provides backend business logic, API routing, or database models for the RetailIQ platform.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.dependencies import get_db, get_current_user

router = APIRouter()

@router.get("")
def get_recommendations(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    recommendations = []

    # 1. Inventory Risk: Low stock but high sales velocity
    inv_q = text("""
        SELECT p.name, SUM(i.stock_quantity) as total_stock, SUM(oi.quantity) as sales_30d
        FROM products p
        JOIN inventory i ON p.product_id = i.product_id
        JOIN order_items oi ON p.product_id = oi.product_id
        JOIN orders o ON oi.order_id = o.order_id
        WHERE o.order_date >= CURRENT_DATE - INTERVAL '60 days'
        GROUP BY p.name
        HAVING SUM(i.stock_quantity) < 100 AND SUM(oi.quantity) > 50
        ORDER BY sales_30d DESC LIMIT 1
    """)
    inv_row = db.execute(inv_q).fetchone()
    if inv_row:
        recommendations.append({
            "type": "critical",
            "category": "Inventory",
            "impact": "High",
            "title": f"Stockout Risk: {inv_row.name}",
            "description": f"This product is selling rapidly ({inv_row.sales_30d} units recently) but only has {inv_row.total_stock} units left in stock across all warehouses.",
            "action": f"Step 1: Contact your primary supplier immediately to expedite a purchase order for at least {max(100, int(inv_row.sales_30d * 1.5))} units of '{inv_row.name}'.\nStep 2: Temporarily reduce ad spend for this specific product to slow burn rate.\nStep 3: Audit current warehouse allocation to ensure remaining units are distributed to high-demand fulfillment centers."
        })

    # 2. Churn Risk: VIP customers who haven't bought recently
    churn_q = text("""
        WITH customer_stats AS (
            SELECT c.customer_id, c.first_name, c.last_name, 
                   SUM(o.total_amount) as total_spent,
                   MAX(o.order_date) as last_order
            FROM customers c
            JOIN orders o ON c.customer_id = o.customer_id
            WHERE o.status != 'cancelled'
            GROUP BY c.customer_id, c.first_name, c.last_name
        )
        SELECT first_name, last_name, total_spent, last_order
        FROM customer_stats
        WHERE total_spent > 1500 AND last_order < CURRENT_DATE - INTERVAL '90 days'
        ORDER BY total_spent DESC LIMIT 1
    """)
    churn_row = db.execute(churn_q).fetchone()
    if churn_row:
        recommendations.append({
            "type": "warning",
            "category": "Customers",
            "impact": "High",
            "title": f"VIP Churn Risk: {churn_row.first_name} {churn_row.last_name}",
            "description": f"This high-value customer has spent ${float(churn_row.total_spent):,.2f} historically, but their last purchase was on {churn_row.last_order}. They are at high risk of churning.",
            "action": f"Step 1: Assign an account manager to personally call or email {churn_row.first_name} within 24 hours to check in.\nStep 2: Generate a single-use, 20% off 'We Miss You' promotional code valid for 7 days.\nStep 3: Flag their account in the CRM for elevated support priority if they return."
        })

    # 3. Growth Opportunity: Fastest growing region
    growth_q = text("""
        WITH state_sales AS (
            SELECT shipping_state, 
                   SUM(CASE WHEN order_date >= CURRENT_DATE - INTERVAL '30 days' THEN total_amount ELSE 0 END) as sales_this_month,
                   SUM(CASE WHEN order_date >= CURRENT_DATE - INTERVAL '60 days' AND order_date < CURRENT_DATE - INTERVAL '30 days' THEN total_amount ELSE 0 END) as sales_last_month
            FROM orders
            WHERE status != 'cancelled'
            GROUP BY shipping_state
        )
        SELECT shipping_state, sales_this_month, sales_last_month,
               ((sales_this_month - sales_last_month) / NULLIF(sales_last_month, 0)) * 100 as growth
        FROM state_sales
        WHERE sales_last_month > 1000
        ORDER BY growth DESC NULLS LAST LIMIT 1
    """)
    growth_row = db.execute(growth_q).fetchone()
    if growth_row and growth_row.growth and growth_row.growth > 0:
        recommendations.append({
            "type": "success",
            "category": "Market",
            "impact": "Medium",
            "title": f"Emerging Market: {growth_row.shipping_state}",
            "description": f"Sales in {growth_row.shipping_state} have grown by {float(growth_row.growth):.1f}% over the last 30 days, generating ${float(growth_row.sales_this_month):,.2f} in recent revenue.",
            "action": f"Step 1: Reallocate 15-20% of your current digital ad budget specifically to geo-targeted campaigns in {growth_row.shipping_state}.\nStep 2: Analyze the top 3 best-selling products in this state and feature them in localized email blasts.\nStep 3: Evaluate shipping logistics to this region to ensure fast delivery times can be maintained during the surge."
        })

    # 4. Market Basket Analysis: Cross-sell opportunity
    basket_q = text("""
        WITH product_pairs AS (
            SELECT p1.name as p1_name, p2.name as p2_name,
                   COUNT(*) as times_bought_together
            FROM order_items oi1
            JOIN order_items oi2 ON oi1.order_id = oi2.order_id AND oi1.product_id < oi2.product_id
            JOIN products p1 ON oi1.product_id = p1.product_id
            JOIN products p2 ON oi2.product_id = p2.product_id
            GROUP BY p1.name, p2.name
        )
        SELECT p1_name, p2_name, times_bought_together
        FROM product_pairs
        WHERE times_bought_together > 1
        ORDER BY times_bought_together DESC LIMIT 1
    """)
    basket_row = db.execute(basket_q).fetchone()
    if basket_row:
        recommendations.append({
            "type": "info",
            "category": "Sales",
            "impact": "Medium",
            "title": "Cross-Sell Bundle Opportunity",
            "description": f"Market Basket Analysis shows that '{basket_row.p1_name}' and '{basket_row.p2_name}' are frequently bought together.",
            "action": f"Step 1: Create a dedicated 'Bundle & Save' SKU combining '{basket_row.p1_name}' and '{basket_row.p2_name}' with a 10% discount.\nStep 2: Update the product page for both items to feature a 'Frequently Bought Together' widget.\nStep 3: Launch a retargeting email campaign to customers who bought only one of these items, offering them the complementary product."
        })

    # 5. VIP Upgrade: Customer hit a major milestone
    vip_q = text("""
        WITH customer_spent AS (
            SELECT c.first_name, c.last_name, c.email, SUM(o.total_amount) as total_spent
            FROM customers c
            JOIN orders o ON c.customer_id = o.customer_id
            WHERE o.status != 'cancelled'
            GROUP BY c.customer_id, c.first_name, c.last_name, c.email
        )
        SELECT first_name, last_name, total_spent
        FROM customer_spent
        WHERE total_spent > 5000
        ORDER BY total_spent DESC LIMIT 1
    """)
    vip_row = db.execute(vip_q).fetchone()
    if vip_row:
        recommendations.append({
            "type": "success",
            "category": "Customers",
            "impact": "Low",
            "title": f"VIP Milestone: {vip_row.first_name} {vip_row.last_name}",
            "description": f"This customer has just surpassed ${float(vip_row.total_spent):,.2f} in lifetime value.",
            "action": f"Step 1: Immediately upgrade {vip_row.first_name}'s account to the 'Platinum Tier' to unlock free expedited shipping.\nStep 2: Have a company executive send a handwritten thank-you note or a personalized video message.\nStep 3: Ship a complimentary exclusive gift or sample of an upcoming product to build long-term brand loyalty."
        })

    # Fallback generic recommendation if none of the specific ones trigger
    if not recommendations:
        recommendations.append({
            "type": "info",
            "category": "General",
            "impact": "Low",
            "title": "System Operating Normally",
            "description": "No critical anomalies or major shifts detected in the recent data stream.",
            "action": "Continue monitoring the dashboard for updates."
        })

    return {"recommendations": recommendations}
