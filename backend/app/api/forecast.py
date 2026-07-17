from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.dependencies import get_db, get_current_user

router = APIRouter()

@router.get("")
def get_forecast(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    # Get monthly actuals
    actuals_q = text("""
        SELECT
            DATE_TRUNC('month', order_date) as month,
            TO_CHAR(order_date, 'Mon YYYY') as label,
            SUM(total_amount) as actual_revenue,
            COUNT(order_id) as order_count
        FROM orders
        WHERE status != 'cancelled'
        GROUP BY DATE_TRUNC('month', order_date), TO_CHAR(order_date, 'Mon YYYY')
        ORDER BY month
    """)
    actuals = db.execute(actuals_q).fetchall()

    results = []
    revenues = [float(r.actual_revenue) for r in actuals]

    if len(revenues) >= 3:
        for i, r in enumerate(actuals):
            actual = float(r.actual_revenue)
            # Simple seasonal naive forecast: use 3-month rolling avg with 5% growth
            if i < 3:
                forecast = actual * 0.97  # slight underestimate for early months
            else:
                window = revenues[i-3:i]
                forecast = (sum(window) / len(window)) * 1.05

            results.append({
                "month": r.label,
                "actual": round(actual, 2),
                "forecast": round(forecast, 2),
                "error": round(abs(actual - forecast), 2),
            })

        # Generate future predictions for the next 6 months
        import datetime
        last_date = actuals[-1].month
        future_revenues = list(revenues)
        
        year = last_date.year
        month = last_date.month
        
        for i in range(1, 7):
            month += 1
            if month > 12:
                month = 1
                year += 1
            
            next_date = datetime.date(year, month, 1)
            next_label = next_date.strftime('%b %Y')
            
            window = future_revenues[-3:]
            forecast = (sum(window) / len(window)) * 1.05
            future_revenues.append(forecast)
            
            results.append({
                "month": next_label,
                "actual": 0,
                "forecast": round(forecast, 2),
                "error": 0,
            })

    # Calculate metrics
    if results:
        errors = [r["error"] for r in results]
        actuals_list = [r["actual"] for r in results]
        mae = sum(errors) / len(errors)
        rmse = (sum(e**2 for e in errors) / len(errors)) ** 0.5
        mape = (sum(e/a for e, a in zip(errors, actuals_list) if a > 0) / len(errors)) * 100
    else:
        mae = rmse = mape = 0

    # Product-wise forecast (Top 15 products based on last 90 days)
    product_q = text("""
        SELECT
            p.name, p.category,
            SUM(oi.line_total) as recent_revenue,
            SUM(oi.quantity) as recent_units
        FROM order_items oi
        JOIN products p ON oi.product_id = p.product_id
        JOIN orders o ON oi.order_id = o.order_id
        WHERE o.status != 'cancelled'
          AND o.order_date >= CURRENT_DATE - INTERVAL '90 days'
        GROUP BY p.name, p.category
        ORDER BY recent_revenue DESC
    """)
    product_rows = db.execute(product_q).fetchall()
    product_forecasts = []
    for r in product_rows:
        # Calculate monthly average over last 90 days and apply 5% growth
        forecast_revenue = (float(r.recent_revenue) / 3.0) * 1.05
        forecast_units = int((float(r.recent_units) / 3.0) * 1.05)
        
        product_forecasts.append({
            "name": r.name,
            "category": r.category,
            "forecast_revenue": round(forecast_revenue, 2),
            "forecast_units": forecast_units
        })

    return {
        "data": results,
        "metrics": {
            "mae": round(mae, 2),
            "rmse": round(rmse, 2),
            "mape": round(mape, 2),
        },
        "products": product_forecasts
    }
