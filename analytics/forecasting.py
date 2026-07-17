"""
RetailIQ - Demand Forecasting Engine
Trains multiple models (including XGBoost) to forecast demand.
"""
import pandas as pd
import numpy as np
import os
import joblib
from sklearn.model_selection import TimeSeriesSplit
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import xgboost as xgb
import warnings
warnings.filterwarnings('ignore')

DATA_DIR = '../data/raw'
MODEL_DIR = '../ml/models'
RESULTS_DIR = '../ml/results'

os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(RESULTS_DIR, exist_ok=True)

def load_and_prep_data():
    print("Loading orders and items...")
    orders = pd.read_csv(f'{DATA_DIR}/orders.csv')
    items = pd.read_csv(f'{DATA_DIR}/order_items.csv')
    
    # Merge and aggregate by date
    orders['order_date'] = pd.to_datetime(orders['order_date'])
    df = pd.merge(items, orders, on='order_id')
    
    # Daily total revenue
    daily_revenue = df.groupby('order_date')['line_total'].sum().reset_index()
    daily_revenue.set_index('order_date', inplace=True)
    
    # Ensure continuous date range
    idx = pd.date_range(daily_revenue.index.min(), daily_revenue.index.max())
    daily_revenue = daily_revenue.reindex(idx, fill_value=0)
    
    return daily_revenue

def engineer_features(df):
    print("Engineering features...")
    df = df.copy()
    df['day_of_week'] = df.index.dayofweek
    df['month'] = df.index.month
    df['quarter'] = df.index.quarter
    df['is_weekend'] = df.index.dayofweek.isin([5, 6]).astype(int)
    
    # Lags
    for i in [1, 7, 14, 30]:
        df[f'lag_{i}'] = df['line_total'].shift(i)
        
    # Rolling means
    for i in [7, 14, 30]:
        df[f'rolling_mean_{i}'] = df['line_total'].shift(1).rolling(window=i).mean()
        
    df.dropna(inplace=True)
    return df

def train_and_evaluate():
    df = load_and_prep_data()
    df = engineer_features(df)
    
    X = df.drop('line_total', axis=1)
    y = df['line_total']
    
    # Train-test split (chronological)
    split_idx = int(len(df) * 0.8)
    X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
    y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]
    
    models = {
        'Linear Regression': LinearRegression(),
        'Ridge': Ridge(),
        'Random Forest': RandomForestRegressor(n_estimators=100, random_state=42),
        'XGBoost': xgb.XGBRegressor(n_estimators=100, learning_rate=0.1, random_state=42)
    }
    
    results = []
    
    print("Training models...")
    for name, model in models.items():
        model.fit(X_train, y_train)
        preds = model.predict(X_test)
        
        rmse = np.sqrt(mean_squared_error(y_test, preds))
        mae = mean_absolute_error(y_test, preds)
        mape = np.mean(np.abs((y_test - preds) / y_test)) * 100
        r2 = r2_score(y_test, preds)
        
        results.append({
            'Model': name,
            'RMSE': round(rmse, 2),
            'MAE': round(mae, 2),
            'MAPE': round(mape, 2),
            'R2': round(r2, 4)
        })
        
        # Save model
        joblib.dump(model, f'{MODEL_DIR}/{name.lower().replace(" ", "_")}.pkl')
        
    results_df = pd.DataFrame(results)
    results_df.to_csv(f'{RESULTS_DIR}/model_comparison.csv', index=False)
    print("\nModel Performance:")
    print(results_df.to_string(index=False))
    
    print(f"\nSaved models to {MODEL_DIR}")
    print(f"Saved results to {RESULTS_DIR}")

if __name__ == "__main__":
    train_and_evaluate()
