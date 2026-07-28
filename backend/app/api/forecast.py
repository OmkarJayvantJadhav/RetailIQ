"""
RetailIQ Backend System
File: forecast.py
Purpose: Provides backend business logic, API routing, or database models for the RetailIQ platform.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.dependencies import get_db, get_current_user, get_pagination
import pandas as pd
import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error
from statsmodels.tsa.holtwinters import ExponentialSmoothing
import datetime

router = APIRouter()

class ForecastCache:
    def __init__(self):
        self.last_updated = None
        self.historical_data = []
        self.future_dates = []
        self.future_preds = []
        self.base_margin = 0.0
        self.metrics = {}
        self.products = []

forecast_cache = ForecastCache()

import time

def update_cache(db: Session):
    print(f"[{datetime.datetime.now()}] update_cache: starting")
    t0 = time.time()
    
    # 1. Get historical monthly actuals
    actuals_q = text("""
        SELECT
            DATE_TRUNC('month', o.order_date) as month,
            TO_CHAR(o.order_date, 'Mon YYYY') as label,
            SUM(oi.line_total) as actual_revenue,
            COUNT(DISTINCT o.order_id) as order_count
        FROM orders o
        JOIN order_items oi ON o.order_id = oi.order_id
        WHERE o.status != 'cancelled'
        GROUP BY DATE_TRUNC('month', o.order_date), TO_CHAR(o.order_date, 'Mon YYYY')
        ORDER BY month
    """)
    actuals = db.execute(actuals_q).fetchall()
    
    t1 = time.time()
    print(f"[{datetime.datetime.now()}] update_cache: actuals query took {t1-t0}s")
    
    if not actuals or len(actuals) < 3:
        return

    df = pd.DataFrame(actuals)
    df.columns = ['month', 'label', 'actual_revenue', 'order_count']
    df['month'] = pd.to_datetime(df['month'])
    df['actual_revenue'] = df['actual_revenue'].astype(float)
    df.set_index('month', inplace=True)
    
    y = df['actual_revenue']
    
    seasonal_periods = 12 if len(y) >= 24 else (4 if len(y) >= 8 else None)
    
    if seasonal_periods:
        model = ExponentialSmoothing(y, trend='add', seasonal='add', seasonal_periods=seasonal_periods, initialization_method="estimated")
    else:
        model = ExponentialSmoothing(y, trend='add', initialization_method="estimated")
        
    fit_model = model.fit()
    
    df['forecast'] = fit_model.fittedvalues
    df['error'] = abs(df['actual_revenue'] - df['forecast'])
    
    last_date = df.index[-1]
    future_dates = [last_date + pd.DateOffset(months=i) for i in range(1, 7)]
    future_preds = fit_model.forecast(6)
    
    rmse = float(np.sqrt(mean_squared_error(y, df['forecast'])))
    mae = float(mean_absolute_error(y, df['forecast']))
    mape = float((abs((y - df['forecast']) / y).replace([np.inf, -np.inf], np.nan).mean()) * 100)
    
    forecast_cache.base_margin = 1.96 * rmse
    forecast_cache.metrics = {
        "mae": round(mae, 2),
        "rmse": round(rmse, 2),
        "mape": round(mape, 2)
    }
    
    forecast_cache.historical_data = []
    for idx, row in df.iterrows():
        forecast_cache.historical_data.append({
            "month": row['label'],
            "actual": round(float(row['actual_revenue']), 2),
            "forecast": round(float(row['forecast']), 2),
            "error": round(float(row['error']), 2),
            "lower_bound": None,
            "upper_bound": None
        })
        
    forecast_cache.future_dates = [{"month": d.strftime('%b %Y')} for d in future_dates]
    forecast_cache.future_preds = [float(p) for p in future_preds]
    
    t2 = time.time()
    print(f"[{datetime.datetime.now()}] update_cache: statsmodels took {t2-t1}s")

    product_q = text("""
        WITH monthly_sales AS (
            SELECT p.product_id, p.name, p.category, 
                   DATE_TRUNC('month', o.order_date) as month,
                   SUM(oi.line_total) as revenue,
                   SUM(oi.quantity) as units
            FROM order_items oi
            JOIN products p ON oi.product_id = p.product_id
            JOIN orders o ON oi.order_id = o.order_id
            WHERE o.status != 'cancelled'
            GROUP BY p.product_id, p.name, p.category, DATE_TRUNC('month', o.order_date)
        ),
        product_stock AS (
            SELECT product_id, SUM(stock_quantity) as current_stock
            FROM inventory
            GROUP BY product_id
        )
        SELECT m.name, m.category, m.month, m.revenue, m.units, COALESCE(s.current_stock, 0) as current_stock
        FROM monthly_sales m
        LEFT JOIN product_stock s ON m.product_id = s.product_id
        ORDER BY m.name, m.month
    """)
    product_rows = db.execute(product_q).fetchall()
    
    t3 = time.time()
    print(f"[{datetime.datetime.now()}] update_cache: product_q took {t3-t2}s")
    
    if not product_rows:
        return
        
    # Sort rows directly by name, category, month
    product_rows.sort(key=lambda x: (x.name, x.category, x.month if x.month else datetime.date.min))
    
    ewma_state = {}
    alpha = 2 / (3 + 1)
    
    # Track the latest month and recent sales per product
    latest_month = None
    recent_sales_map = {}
    
    for row in product_rows:
        if row.month and (latest_month is None or row.month > latest_month):
            latest_month = row.month
            
    last_180_date = None
    if latest_month:
        # Fallback for date subtraction depending on if it's datetime.date or datetime.datetime
        last_180_date = latest_month - datetime.timedelta(days=180)
    
    for row in product_rows:
        name = row.name
        cat = row.category
        rev = float(row.revenue or 0)
        units = float(row.units or 0)
        stock = int(row.current_stock or 0)
        
        key = (name, cat)
        if key not in ewma_state:
            ewma_state[key] = {'rev': rev, 'units': units, 'stock': stock}
        else:
            ewma_state[key]['rev'] = (rev * alpha) + (ewma_state[key]['rev'] * (1 - alpha))
            ewma_state[key]['units'] = (units * alpha) + (ewma_state[key]['units'] * (1 - alpha))
            ewma_state[key]['stock'] = stock
            
        # Accumulate recent sales for sorting later
        if last_180_date and row.month and row.month >= last_180_date:
            recent_sales_map[key] = recent_sales_map.get(key, 0) + rev

    # Create ordered list of products by recent revenue
    ordered_keys = sorted(recent_sales_map.keys(), key=lambda k: recent_sales_map[k], reverse=True)
    
    forecast_cache.products = []
    for key in ordered_keys:
        if key in ewma_state:
            state = ewma_state[key]
            forecast_cache.products.append({
                "name": key[0],
                "category": key[1],
                "base_rev": float(state['rev']),
                "base_units": float(state['units']),
                "current_stock": int(state['stock'])
            })
            
    forecast_cache.last_updated = datetime.datetime.now()
    t4 = time.time()
    print(f"[{datetime.datetime.now()}] update_cache: Python EWMA took {t4-t3}s. Total time: {t4-t0}s")

@router.get("")
def get_forecast(
    db: Session = Depends(get_db), 
    current_user=Depends(get_current_user),
    scenario_modifier: float = Query(1.0, description="Multiplier for scenario planning (e.g. 1.1 for +10%)"),
    risk_only: bool = Query(False, description="Filter for stockout risks only"),
    pagination: dict = Depends(get_pagination)
):
    now = datetime.datetime.now()
    if not forecast_cache.last_updated or (now - forecast_cache.last_updated).total_seconds() > 3600:
        update_cache(db)
        
    if not forecast_cache.last_updated:
        return {"data": [], "metrics": {"mae": 0, "rmse": 0, "mape": 0}, "products": [], "total_products": 0}

    results = list(forecast_cache.historical_data)
    
    for step_i, (idx_dict, pred) in enumerate(zip(forecast_cache.future_dates, forecast_cache.future_preds)):
        modified_pred = pred * scenario_modifier
        margin = forecast_cache.base_margin * np.sqrt(step_i + 1)
        
        lower_bound = max(0, modified_pred - margin)
        upper_bound = modified_pred + margin
        
        results.append({
            "month": idx_dict["month"],
            "actual": 0,
            "forecast": round(modified_pred, 2),
            "error": 0,
            "lower_bound": round(float(lower_bound), 2),
            "upper_bound": round(float(upper_bound), 2)
        })

    product_forecasts = []
    for p in forecast_cache.products:
        mod_rev = p['base_rev'] * scenario_modifier
        mod_units = p['base_units'] * scenario_modifier
        
        if risk_only and p['current_stock'] >= mod_units * 3:
            continue
            
        product_forecasts.append({
            "name": p['name'],
            "category": p['category'],
            "forecast_revenue": round(float(mod_rev), 2),
            "forecast_units": int(mod_units),
            "current_stock": p['current_stock']
        })
        
    total_products = len(product_forecasts)
    paginated_forecasts = product_forecasts[pagination["skip"] : pagination["skip"] + pagination["limit"]]

    return {
        "data": results,
        "metrics": forecast_cache.metrics,
        "products": paginated_forecasts,
        "total_products": total_products
    }
