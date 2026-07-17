"""
RetailIQ Platform - Data Validation Pipeline
Validates generated data for correctness before loading to DB.
"""
import pandas as pd
import os
import json

DATA_DIR = '../data/raw'
REPORT_PATH = '../reports/validation_report.md'

os.makedirs('../reports', exist_ok=True)

def validate_data():
    report = ["# Data Validation Report\n\n"]
    errors = 0
    
    try:
        # Load datasets
        states = pd.read_csv(f'{DATA_DIR}/state_demographics.csv')
        customers = pd.read_csv(f'{DATA_DIR}/customers.csv')
        products = pd.read_csv(f'{DATA_DIR}/products.csv')
        warehouses = pd.read_csv(f'{DATA_DIR}/warehouses.csv')
        orders = pd.read_csv(f'{DATA_DIR}/orders.csv')
        items = pd.read_csv(f'{DATA_DIR}/order_items.csv')
        inventory = pd.read_csv(f'{DATA_DIR}/inventory.csv')
        returns = pd.read_csv(f'{DATA_DIR}/returns.csv')
        payments = pd.read_csv(f'{DATA_DIR}/payments.csv')
        
        # 1. Primary Keys
        report.append("## Primary Key Checks")
        def check_pk(df, col, name):
            nonlocal errors
            is_unique = df[col].is_unique
            if not is_unique: errors += 1
            report.append(f"- {'✅' if is_unique else '❌'} {name} `{col}` is unique")
            
        check_pk(states, 'state', 'State Demographics')
        check_pk(customers, 'customer_id', 'Customers')
        check_pk(products, 'product_id', 'Products')
        check_pk(warehouses, 'warehouse_id', 'Warehouses')
        check_pk(orders, 'order_id', 'Orders')
        check_pk(items, 'order_item_id', 'Order Items')
        check_pk(returns, 'return_id', 'Returns')
        check_pk(payments, 'payment_id', 'Payments')
        
        # Composite PK for inventory
        inv_pk_unique = len(inventory.drop_duplicates(subset=['warehouse_id', 'product_id'])) == len(inventory)
        if not inv_pk_unique: errors += 1
        report.append(f"- {'✅' if inv_pk_unique else '❌'} Inventory `warehouse_id, product_id` is unique\n")
        
        # 2. Foreign Keys
        report.append("## Foreign Key Checks")
        def check_fk(child_df, child_col, parent_df, parent_col, name):
            nonlocal errors
            invalid = ~child_df[child_col].isin(parent_df[parent_col])
            count = invalid.sum()
            if count > 0: errors += 1
            report.append(f"- {'✅' if count == 0 else '❌'} {name}: {count} invalid references")
            
        check_fk(customers, 'state', states, 'state', 'Customer -> State')
        check_fk(orders, 'customer_id', customers, 'customer_id', 'Order -> Customer')
        check_fk(items, 'order_id', orders, 'order_id', 'OrderItem -> Order')
        check_fk(items, 'product_id', products, 'product_id', 'OrderItem -> Product')
        check_fk(inventory, 'warehouse_id', warehouses, 'warehouse_id', 'Inventory -> Warehouse')
        check_fk(inventory, 'product_id', products, 'product_id', 'Inventory -> Product')
        check_fk(returns, 'order_id', orders, 'order_id', 'Return -> Order')
        check_fk(returns, 'product_id', products, 'product_id', 'Return -> Product')
        check_fk(payments, 'order_id', orders, 'order_id', 'Payment -> Order')
        report.append("")
        
        # 3. Value Constraints
        report.append("## Value Constraints Checks")
        neg_price = (products['price'] < 0).sum()
        report.append(f"- {'✅' if neg_price == 0 else '❌'} Products: {neg_price} negative prices")
        
        neg_qty = (items['quantity'] < 0).sum()
        report.append(f"- {'✅' if neg_qty == 0 else '❌'} Order Items: {neg_qty} negative quantities")
        
        neg_stock = (inventory['stock_quantity'] < 0).sum()
        report.append(f"- {'✅' if neg_stock == 0 else '❌'} Inventory: {neg_stock} negative stock")
        if neg_price > 0 or neg_qty > 0 or neg_stock > 0: errors += 1
        report.append("")
        
        # 4. Business Logic Consistency
        report.append("## Business Logic Consistency")
        # Order total matches items
        item_sums = items.groupby('order_id')['line_total'].sum().round(2)
        order_totals = orders.set_index('order_id')['total_amount'].round(2)
        mismatch = (item_sums != order_totals).sum()
        report.append(f"- {'✅' if mismatch == 0 else '❌'} Order Totals: {mismatch} mismatches with line items")
        if mismatch > 0: errors += 1
        
        # Payments match order totals
        pay_sums = payments.groupby('order_id')['amount'].sum().round(2)
        pay_mismatch = (pay_sums != order_totals.loc[pay_sums.index]).sum()
        report.append(f"- {'✅' if pay_mismatch == 0 else '❌'} Payment Amounts: {pay_mismatch} mismatches with order totals")
        if pay_mismatch > 0: errors += 1
        report.append("")
        
        # Summary
        report.append("## Summary")
        if errors == 0:
            report.append("**Result: PASS** - All validation checks passed successfully.")
        else:
            report.append(f"**Result: FAIL** - Found {errors} validation check failures. See above.")
            
        with open(REPORT_PATH, 'w', encoding='utf-8') as f:
            f.write('\n'.join(report))
            
        print(f"Validation complete. Errors: {errors}. Report saved to {REPORT_PATH}")
        return errors == 0
        
    except Exception as e:
        print(f"Validation failed with error: {e}")
        return False

if __name__ == "__main__":
    validate_data()
