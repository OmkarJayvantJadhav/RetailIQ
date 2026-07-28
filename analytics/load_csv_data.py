import os
import pandas as pd
from sqlalchemy import create_engine, text
import urllib.request
import bcrypt
import random
import numpy as np

DB_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/retailiq_db")
engine = create_engine(DB_URL)

ORDERS_URL = "https://raw.githubusercontent.com/Ilu27/Ecommerce-Sales-Data-Analysis---Power-Bi/main/Orders.csv"
DETAILS_URL = "https://raw.githubusercontent.com/Ilu27/Ecommerce-Sales-Data-Analysis---Power-Bi/main/Details.csv"

def main():
    print("Downloading dataset...")
    urllib.request.urlretrieve(ORDERS_URL, "Orders.csv")
    urllib.request.urlretrieve(DETAILS_URL, "Details.csv")
    
    print("Loading datasets...")
    orders = pd.read_csv("Orders.csv")
    details = pd.read_csv("Details.csv")
    
    print("Cleaning and mapping schema...")
    # Standardize dates
    orders['Order Date'] = pd.to_datetime(orders['Order Date'], format="%d-%b-%y", errors='coerce')
    
    # Shift dates to be recent (so the max date matches today)
    max_date = orders['Order Date'].max()
    time_shift = pd.Timestamp.today() - max_date
    orders['Order Date'] = orders['Order Date'] + time_shift
    
    # Merge datasets on Order ID
    df = pd.merge(orders, details, on='Order ID', how='inner')
    
    # 1. Customers
    unique_customers = df[['CustomerName', 'State', 'City']].drop_duplicates().reset_index(drop=True)
    unique_customers['customer_id'] = unique_customers.index + 1
    
    customers_df = unique_customers.copy()
    customers_df = customers_df.rename(columns={
        'CustomerName': 'first_name',
        'State': 'state',
        'City': 'city'
    })
    customers_df['last_name'] = ""
    customers_df['email'] = customers_df['first_name'].str.lower().str.replace(' ', '.') + customers_df['customer_id'].astype(str) + "@example.com"
    customers_df['phone'] = "555-" + customers_df['customer_id'].astype(str).str.zfill(4)
    customers_df['age'] = customers_df['customer_id'].apply(lambda x: 18 + (hash(str(x)) % 47))
    genders = ['Male', 'Female', 'Other']
    customers_df['gender'] = customers_df['customer_id'].apply(lambda x: genders[hash(str(x) + "g") % 3])
    incomes = ['Low', 'Medium', 'Medium', 'High']
    customers_df['income_level'] = customers_df['customer_id'].apply(lambda x: incomes[hash(str(x) + "i") % 4])
    # Generate random join dates distributed between 1 and 3 years ago
    np.random.seed(42)
    customers_df['join_date'] = pd.Timestamp.today() - pd.to_timedelta(np.random.randint(1, 1000, size=len(customers_df)), unit='d')
    customers_df['is_active'] = True
    
    customer_mapping = unique_customers.set_index(['CustomerName', 'State', 'City'])['customer_id'].to_dict()
    df['customer_id'] = df.apply(lambda row: customer_mapping[(row['CustomerName'], row['State'], row['City'])], axis=1)
    
    # 2. Products
    unique_products = df[['Sub-Category', 'Category']].drop_duplicates().reset_index(drop=True)
    unique_products['product_id'] = unique_products.index + 1
    
    products_df = unique_products.copy()
    products_df = products_df.rename(columns={
        'Sub-Category': 'name',
        'Category': 'category'
    })
    products_df['sub_category'] = 'General'
    products_df['brand'] = 'Generic'
    
    # Calculate average price and accurate cost_price using the Profit column
    avg_metrics = df.groupby('Sub-Category').apply(
        lambda x: pd.Series({
            'price': (x['Amount'] / x['Quantity']).mean(),
            'profit_per_item': (x['Profit'] / x['Quantity']).mean()
        })
    ).reset_index()
    
    products_df = pd.merge(products_df, avg_metrics, left_on='name', right_on='Sub-Category', how='left')
    products_df['price'] = products_df['price'].round(2)
    # cost_price = price - profit
    products_df['cost_price'] = (products_df['price'] - products_df['profit_per_item']).round(2)
    products_df = products_df.drop(columns=['Sub-Category', 'profit_per_item'])
    
    products_df['is_active'] = True
    
    product_mapping = unique_products.set_index('Sub-Category')['product_id'].to_dict()
    df['product_id'] = df['Sub-Category'].map(product_mapping)
    
    # 3. Orders
    unique_orders = df[['Order ID', 'customer_id', 'Order Date', 'State', 'City']].drop_duplicates(subset=['Order ID']).reset_index(drop=True)
    unique_orders['order_numeric_id'] = unique_orders.index + 1
    
    order_totals = df.groupby('Order ID')['Amount'].sum().reset_index()
    unique_orders = pd.merge(unique_orders, order_totals, on='Order ID')
    
    orders_df = unique_orders.rename(columns={
        'order_numeric_id': 'order_id',
        'Order Date': 'order_date',
        'State': 'shipping_state',
        'City': 'shipping_city',
        'Amount': 'total_amount'
    })
    orders_df['status'] = 'delivered'
    
    order_mapping = unique_orders.set_index('Order ID')['order_numeric_id'].to_dict()
    df['order_id'] = df['Order ID'].map(order_mapping)
    
    # 4. Order Items
    order_items = df[['order_id', 'product_id', 'Quantity', 'Amount']].copy()
    order_items = order_items.rename(columns={
        'Quantity': 'quantity',
        'Amount': 'total_amount'
    })
    order_items['unit_price'] = (order_items['total_amount'] / order_items['quantity']).round(2)
    order_items['discount_pct'] = 0.0
    order_items['order_item_id'] = order_items.index + 1
    
    # 5. Payments
    payments = df[['order_id', 'Order Date', 'Amount', 'PaymentMode']].copy()
    payments = payments.rename(columns={
        'Order Date': 'payment_date',
        'Amount': 'amount',
        'PaymentMode': 'payment_method'
    })
    payments['payment_method'] = payments['payment_method'].str.lower().str.replace(' ', '_')
    # Map any unknown methods to valid enums
    method_map = {'emi': 'credit_card', 'cod': 'upi', 'credit_card': 'credit_card', 'debit_card': 'debit_card', 'upi': 'upi', 'net_banking': 'net_banking'}
    payments['payment_method'] = payments['payment_method'].map(lambda x: method_map.get(x, 'credit_card'))
    payments['status'] = 'completed'
    payments['transaction_id'] = ["TXN" + str(1000000 + i) for i in range(len(payments))]
    payments['payment_id'] = payments.index + 1
    
    # Demographics
    states = df['State'].unique()
    state_demographics = []
    for s in states:
        state_demographics.append({
            'state': str(s),
            'population': random.randint(1000000, 200000000),
            'literacy_rate': 80.0,
            'per_capita_income': 100000.0,
            'region': 'North'
        })
    df_states = pd.DataFrame(state_demographics).drop_duplicates(subset=['state'])
    
    # Warehouses
    df_wh = pd.DataFrame([{'warehouse_id': 'WH001', 'name': 'Main Hub', 'city': 'Delhi', 'state': 'Delhi', 'capacity': 500000}])
    if 'Delhi' not in df_states['state'].values:
        df_states = pd.concat([df_states, pd.DataFrame([{'state': 'Delhi', 'population': 1, 'literacy_rate': 80, 'per_capita_income': 100000, 'region': 'North'}])], ignore_index=True)
        
    # Inventory
    product_sales = df.groupby('product_id')['Quantity'].sum().to_dict()
    inventory = []
    for pid in products_df['product_id']:
        sales_vol = product_sales.get(pid, 10)
        
        # Calculate realistic inventory levels based on sales velocity
        # High sales -> higher reorder level, lower stock percentage -> triggers stockout risk organically
        reorder = int(sales_vol * 0.1) + 5
        stock = int(sales_vol * (0.05 + (hash(str(pid)) % 15) / 100.0)) + 2
        
        inventory.append({
            'inventory_id': pid,
            'warehouse_id': 'WH001',
            'product_id': pid,
            'stock_quantity': stock,
            'reorder_level': reorder,
            'safety_stock': int(reorder * 0.5)
        })
    df_inv = pd.DataFrame(inventory)
    
    # Users
    users = [
        {'user_id': 1, 'username': 'admin', 'email': 'admin@retailiq.com', 'hashed_password': bcrypt.hashpw(b'admin123', bcrypt.gensalt()).decode('utf-8'), 'role': 'admin', 'is_active': True},
    ]
    df_users = pd.DataFrame(users)
    
    print("Loading data into PostgreSQL Database...")
    with engine.begin() as conn:
        conn.execute(text("TRUNCATE TABLE audit_logs, notifications, payments, returns, inventory, order_items, orders, warehouses, products, customers, users, state_demographics CASCADE;"))
        
        df_states.to_sql('state_demographics', conn, if_exists='append', index=False, chunksize=1000)
        df_users.to_sql('users', conn, if_exists='append', index=False)
        df_wh.to_sql('warehouses', conn, if_exists='append', index=False)
        customers_df[['customer_id', 'first_name', 'last_name', 'email', 'phone', 'age', 'gender', 'city', 'state', 'income_level', 'join_date', 'is_active']].to_sql('customers', conn, if_exists='append', index=False, chunksize=1000)
        products_df.to_sql('products', conn, if_exists='append', index=False)
        orders_df[['order_id', 'customer_id', 'order_date', 'status', 'shipping_city', 'shipping_state', 'total_amount']].to_sql('orders', conn, if_exists='append', index=False, chunksize=1000)
        order_items[['order_item_id', 'order_id', 'product_id', 'quantity', 'unit_price', 'discount_pct']].to_sql('order_items', conn, if_exists='append', index=False, chunksize=1000)
        df_inv.to_sql('inventory', conn, if_exists='append', index=False)
        payments.to_sql('payments', conn, if_exists='append', index=False, chunksize=1000)

    print("Real data loaded successfully!")

if __name__ == "__main__":
    main()
