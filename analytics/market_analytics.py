"""
RetailIQ - Market Analytics Engine
Analyzes state/city performance and correlations with population/income.
"""
import pandas as pd
import numpy as np
import os

DATA_DIR = '../data/raw'
RESULTS_DIR = '../ml/results'

os.makedirs(RESULTS_DIR, exist_ok=True)

def analyze_market_performance():
    print("Performing Market Analysis...")
    orders = pd.read_csv(f'{DATA_DIR}/orders.csv')
    customers = pd.read_csv(f'{DATA_DIR}/customers.csv')
    demographics = pd.read_csv(f'{DATA_DIR}/state_demographics.csv')
    
    # Merge orders with customers to get location data
    df = pd.merge(orders, customers, on='customer_id')
    
    # 1. State/City Performance
    city_perf = df.groupby(['state', 'city']).agg(
        total_revenue=('total_amount', 'sum'),
        order_count=('order_id', 'count')
    ).reset_index()
    city_perf['aov'] = city_perf['total_revenue'] / city_perf['order_count']
    
    state_perf = city_perf.groupby('state').agg(
        total_revenue=('total_revenue', 'sum'),
        order_count=('order_count', 'sum')
    ).reset_index()
    state_perf['aov'] = state_perf['total_revenue'] / state_perf['order_count']
    
    # 2. Demographic Correlations
    state_full = pd.merge(state_perf, demographics, on='state')
    
    # Calculate simple correlations
    corr_revenue_income = state_full['total_revenue'].corr(state_full['per_capita_income'])
    corr_revenue_pop = state_full['total_revenue'].corr(state_full['population'])
    
    print(f"Correlation (Revenue vs Per Capita Income): {corr_revenue_income:.4f}")
    print(f"Correlation (Revenue vs Population): {corr_revenue_pop:.4f}")
    
    # Save results
    city_perf.to_csv(f'{RESULTS_DIR}/city_performance.csv', index=False)
    state_full.to_csv(f'{RESULTS_DIR}/state_performance.csv', index=False)
    
    print(f"\nMarket analysis saved to {RESULTS_DIR}")

if __name__ == "__main__":
    analyze_market_performance()
