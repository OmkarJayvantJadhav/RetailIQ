"""
RetailIQ - Inventory Analytics Engine
Performs ABC Analysis, Inventory Turnover, Overstock detection, and Safety Stock calculation.
"""
import pandas as pd
import numpy as np
import os

DATA_DIR = '../data/raw'
RESULTS_DIR = '../ml/results'

os.makedirs(RESULTS_DIR, exist_ok=True)

def analyze_inventory():
    print("Performing Inventory Analysis...")
    inventory = pd.read_csv(f'{DATA_DIR}/inventory.csv')
    products = pd.read_csv(f'{DATA_DIR}/products.csv')
    order_items = pd.read_csv(f'{DATA_DIR}/order_items.csv')
    
    # 1. ABC Analysis based on revenue
    product_revenue = order_items.groupby('product_id')['line_total'].sum().reset_index()
    product_revenue.rename(columns={'line_total': 'total_revenue'}, inplace=True)
    
    # Sort descending and calculate cumulative percentage
    product_revenue = product_revenue.sort_values(by='total_revenue', ascending=False)
    product_revenue['cum_revenue'] = product_revenue['total_revenue'].cumsum()
    total_rev = product_revenue['total_revenue'].sum()
    product_revenue['cum_pct'] = product_revenue['cum_revenue'] / total_rev
    
    def assign_abc(pct):
        if pct <= 0.70: return 'A'
        elif pct <= 0.90: return 'B'
        else: return 'C'
        
    product_revenue['ABC_Class'] = product_revenue['cum_pct'].apply(assign_abc)
    
    # 2. Overstock Detection & Safety Stock
    # Join inventory with products
    inv_df = pd.merge(inventory, products[['product_id', 'name', 'category', 'price', 'cost_price']], on='product_id')
    inv_df = pd.merge(inv_df, product_revenue[['product_id', 'ABC_Class']], on='product_id', how='left')
    inv_df['ABC_Class'] = inv_df['ABC_Class'].fillna('C')
    
    # Overstock: stock is more than 3x the reorder level
    inv_df['is_overstock'] = inv_df['stock_quantity'] > (inv_df['reorder_level'] * 3)
    
    # Estimate lost revenue from stockouts (if stock is 0 but it's an A class item)
    inv_df['stockout_risk'] = (inv_df['stock_quantity'] <= inv_df['safety_stock'])
    inv_df['est_lost_revenue'] = np.where(
        (inv_df['stock_quantity'] == 0) & (inv_df['ABC_Class'] == 'A'),
        inv_df['reorder_level'] * inv_df['price'], # Crude estimation
        0
    )
    
    # Dead inventory: C class items with high stock
    inv_df['dead_inventory'] = (inv_df['ABC_Class'] == 'C') & inv_df['is_overstock']
    
    print(f"Total Overstocked Items: {inv_df['is_overstock'].sum()}")
    print(f"Total Stockout Risks: {inv_df['stockout_risk'].sum()}")
    print(f"Estimated Lost Revenue (Class A): ${inv_df['est_lost_revenue'].sum():,.2f}")
    
    # Save results
    inv_df.to_csv(f'{RESULTS_DIR}/inventory_analysis.csv', index=False)
    print(f"\nInventory analysis saved to {RESULTS_DIR}")

if __name__ == "__main__":
    analyze_inventory()
