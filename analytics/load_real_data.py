import os
import pandas as pd
from sqlalchemy import create_engine, text
from faker import Faker
import random
import datetime

# Configure Faker for India
fake = Faker('en_IN')

# Database connection
DB_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/retailiq_db")
engine = create_engine(DB_URL)

def generate_amazon_india_data(num_records=50000):
    print("Generating highly realistic Indian E-commerce Dataset...")
    records = []
    cities_states = [
        ('Mumbai', 'Maharashtra'), ('Pune', 'Maharashtra'), ('Nagpur', 'Maharashtra'),
        ('Delhi', 'Delhi'),
        ('Bangalore', 'Karnataka'), ('Mysore', 'Karnataka'),
        ('Chennai', 'Tamil Nadu'), ('Coimbatore', 'Tamil Nadu'),
        ('Kolkata', 'West Bengal'), ('Ahmedabad', 'Gujarat'), ('Surat', 'Gujarat'),
        ('Hyderabad', 'Telangana'), ('Jaipur', 'Rajasthan'), ('Lucknow', 'Uttar Pradesh'),
        ('Visakhapatnam', 'Andhra Pradesh'), ('Itanagar', 'Arunachal Pradesh'), ('Guwahati', 'Assam'), 
        ('Patna', 'Bihar'), ('Raipur', 'Chhattisgarh'), ('Panaji', 'Goa'), ('Chandigarh', 'Chandigarh'),
        ('Gurugram', 'Haryana'), ('Shimla', 'Himachal Pradesh'), ('Ranchi', 'Jharkhand'),
        ('Kochi', 'Kerala'), ('Indore', 'Madhya Pradesh'), ('Imphal', 'Manipur'), ('Shillong', 'Meghalaya'),
        ('Aizawl', 'Mizoram'), ('Kohima', 'Nagaland'), ('Bhubaneswar', 'Odisha'), ('Ludhiana', 'Punjab'),
        ('Gangtok', 'Sikkim'), ('Agartala', 'Tripura'), ('Dehradun', 'Uttarakhand'),
        ('Port Blair', 'Andaman and Nicobar Islands'), ('Daman', 'Dadra and Nagar Haveli and Daman and Diu'),
        ('Srinagar', 'Jammu and Kashmir'), ('Leh', 'Ladakh'), ('Kavaratti', 'Lakshadweep'), ('Puducherry', 'Puducherry')
    ]
    
    statuses = ['Shipped', 'Shipped', 'Shipped', 'Shipped', 'Cancelled', 'Delivered', 'Delivered', 'Delivered', 'Delivered']
    
    PRODUCT_CATALOG = [
        ("Apple iPhone 14 Pro", "Electronics", 120000), ("Samsung Galaxy S23", "Electronics", 85000),
        ("Sony WH-1000XM5", "Electronics", 29000), ("Dell XPS 15", "Electronics", 150000),
        ("MacBook Air M2", "Electronics", 110000), ("Nike Air Max", "Sports", 8500),
        ("Adidas Ultraboost", "Sports", 12000), ("Puma Running Shoes", "Sports", 4500),
        ("Levi's 511 Jeans", "Clothing", 2500), ("Zara Summer Dress", "Clothing", 3500),
        ("H&M Cotton T-Shirt", "Clothing", 800), ("Sony PlayStation 5", "Electronics", 49990),
        ("Xbox Series X", "Electronics", 49990), ("Nintendo Switch OLED", "Electronics", 35000),
        ("LG 55-inch OLED TV", "Electronics", 110000), ("Samsung 4K Smart TV", "Electronics", 55000),
        ("Philips Air Fryer", "Home", 7500), ("Dyson V11 Vacuum", "Home", 45000),
        ("Prestige Cooker", "Home", 1800), ("IKEA Lack Table", "Home", 1500),
        ("Atomic Habits", "Books", 500), ("Psychology of Money", "Books", 350),
        ("Harry Potter Set", "Books", 2500), ("Rich Dad Poor Dad", "Books", 400),
        ("Lego Millennium Falcon", "Toys", 14500), ("Hot Wheels Pack", "Toys", 5500),
        ("Barbie Dreamhouse", "Toys", 18000), ("Nerf Elite Blaster", "Toys", 2200),
        ("L'Oreal Serum", "Beauty", 900), ("MAC Lipstick", "Beauty", 1800),
        ("Maybelline Foundation", "Beauty", 600), ("Clinique Moisturizer", "Beauty", 2500),
        ("Yonex Racquet", "Sports", 3500), ("Spalding Basketball", "Sports", 1500),
        ("Casio G-Shock", "Clothing", 8500), ("Apple Watch Series 8", "Electronics", 42000),
        ("Bose SoundLink", "Electronics", 12000), ("Kindle Paperwhite", "Electronics", 11000)
    ]
    
    start_date = datetime.date.today() - datetime.timedelta(days=365)
    
    cities_weights = [
        15, 6, 2,  # Maharashtra
        18,        # Delhi
        15, 3,     # Karnataka
        12, 4,     # Tamil Nadu
        7, 8, 4,   # WB, Gujarat
        9, 6, 8,   # Telangana, Rajasthan, UP
        5, 1, 3,   # AP, Arunachal, Assam
        4, 2, 2, 2,# Bihar, Chhattisgarh, Goa, Chandigarh
        6, 1, 2,   # Haryana, Himachal, Jharkhand
        5, 5, 1, 1,# Kerala, MP, Manipur, Meghalaya
        1, 1, 3, 3,# Mizoram, Nagaland, Odisha, Punjab
        1, 1, 2,   # Sikkim, Tripura, Uttarakhand
        1, 1,      # Andaman, Dadra
        2, 1, 1, 1 # J&K, Ladakh, Lakshadweep, Puducherry
    ]
    for i in range(num_records):
        city, state = random.choices(cities_states, weights=cities_weights)[0]
        prod_name, prod_cat, prod_price = random.choice(PRODUCT_CATALOG)
        
        # Add random variance to price (discounts etc)
        actual_price = prod_price * random.uniform(0.85, 1.05)
        qty = random.randint(1, 3)
        
        records.append({
            'Order ID': f"404-{random.randint(1000000, 9999999)}-{random.randint(1000000, 9999999)}",
            'Date': start_date + datetime.timedelta(days=random.randint(0, 365)),
            'Status': random.choice(statuses),
            'SKU': prod_name,
            'Category': prod_cat,
            'Qty': qty,
            'Amount': round(actual_price * qty, 2),
            'ship-city': city,
            'ship-state': state
        })
    return pd.DataFrame(records)

def main():
    print("Starting ETL Pipeline for Real Indian E-commerce Data...")
    
    df = generate_amazon_india_data(50000)
    
    print(f"Loaded {len(df)} records.")

    # Process Indian States mapping to ensure consistency
    states = df['ship-state'].str.title().unique()
    state_demographics = []
    regions = ['North', 'South', 'East', 'West', 'Central']
    for s in states:
        state_demographics.append({
            'state': s[:100],
            'population': random.randint(1000000, 200000000),
            'literacy_rate': round(random.uniform(60.0, 99.0), 2),
            'per_capita_income': round(random.uniform(50000, 300000), 2),
            'region': random.choice(regions)
        })
    df_states = pd.DataFrame(state_demographics)

    # Products
    print("Extracting Products...")
    products = df[['SKU', 'Category', 'Amount']].groupby('SKU').first().reset_index()
    products = products.rename(columns={'SKU': 'name', 'Category': 'category', 'Amount': 'price'})
    products['sub_category'] = 'General'
    products['brand'] = 'Amazon'
    products['price'] = products['price'].apply(lambda x: max(float(x), 10.0))
    products['cost_price'] = products['price'] * 0.7
    products['is_active'] = True
    products['product_id'] = range(1, len(products) + 1)
    
    # Mapping for product_id
    sku_to_pid = dict(zip(products['name'], products['product_id']))

    # Customers
    print("Synthesizing Customers based on Orders...")
    unique_orders = df['Order ID'].unique()
    num_customers = int(len(unique_orders) * 0.7)
    
    customers = []
    incomes = ['Low', 'Medium', 'High', 'Premium']
    genders = ['Male', 'Female', 'Other']
    
    locations = df[['ship-city', 'ship-state']].drop_duplicates().values
    
    for i in range(1, num_customers + 1):
        loc = random.choice(locations)
        customers.append({
            'customer_id': i,
            'first_name': fake.first_name()[:100],
            'last_name': fake.last_name()[:100],
            'email': f"user{i}@example.com",
            'phone': fake.phone_number()[:20],
            'age': random.randint(18, 80),
            'gender': random.choice(genders),
            'city': str(loc[0])[:100],
            'state': str(loc[1]).title()[:100],
            'income_level': random.choices(incomes, weights=[30, 45, 15, 10])[0],
            'join_date': fake.date_between(start_date='-5y', end_date='today'),
            'is_active': True
        })
    df_customers = pd.DataFrame(customers)

    # Map Orders to Customers
    print("Processing Orders...")
    order_to_cid = {}
    for oid in unique_orders:
        order_to_cid[oid] = random.randint(1, num_customers)

    # Process Orders Table
    orders_df = df.groupby('Order ID').agg({
        'Date': 'first',
        'Status': 'first',
        'ship-city': 'first',
        'ship-state': 'first',
        'Amount': 'sum'
    }).reset_index()
    
    def map_status(s):
        s = str(s).lower()
        if 'cancel' in s: return 'cancelled'
        if 'ship' in s: return 'shipped'
        if 'deliver' in s: return 'delivered'
        return 'completed'

    orders_df['customer_id'] = orders_df['Order ID'].map(order_to_cid)
    orders_df['status'] = orders_df['Status'].apply(map_status)
    orders_df = orders_df.rename(columns={
        'Date': 'order_date',
        'ship-city': 'shipping_city',
        'ship-state': 'shipping_state',
        'Amount': 'total_amount'
    })
    orders_df['shipping_state'] = orders_df['shipping_state'].str.title()
    orders_df['order_id'] = range(1, len(orders_df) + 1)
    
    oid_map = dict(zip(orders_df['Order ID'], orders_df['order_id']))

    # Process Order Items Table
    print("Processing Order Items...")
    df['order_id'] = df['Order ID'].map(oid_map)
    df['product_id'] = df['SKU'].map(sku_to_pid)
    
    order_items = df[['order_id', 'product_id', 'Qty', 'Amount']].copy()
    order_items = order_items.rename(columns={'Qty': 'quantity', 'Amount': 'unit_price'})
    order_items['quantity'] = order_items['quantity'].apply(lambda x: max(int(x), 1))
    order_items['unit_price'] = order_items['unit_price'] / order_items['quantity']
    order_items['unit_price'] = order_items['unit_price'].apply(lambda x: max(float(x), 10.0))
    order_items['discount_pct'] = 0.0
    order_items = order_items.dropna()
    order_items['order_item_id'] = range(1, len(order_items) + 1)

    # Warehouses
    print("Synthesizing Warehouses and Inventory...")
    warehouses = [
        {'warehouse_id': 'WH001', 'name': 'North Hub', 'city': 'Delhi', 'state': 'Delhi', 'capacity': 500000},
        {'warehouse_id': 'WH002', 'name': 'West Hub', 'city': 'Mumbai', 'state': 'Maharashtra', 'capacity': 600000},
        {'warehouse_id': 'WH003', 'name': 'South Hub', 'city': 'Bangalore', 'state': 'Karnataka', 'capacity': 550000}
    ]
    df_wh = pd.DataFrame(warehouses)
    
    for w in warehouses:
        if w['state'] not in df_states['state'].values:
            df_states = pd.concat([df_states, pd.DataFrame([{
                'state': w['state'], 'population': 50000000, 'literacy_rate': 85.0, 'per_capita_income': 150000.0, 'region': 'West'
            }])], ignore_index=True)

    # Inventory
    inventory = []
    inv_id = 1
    for pid in products['product_id']:
        for w in warehouses:
            inventory.append({
                'inventory_id': inv_id,
                'warehouse_id': w['warehouse_id'],
                'product_id': pid,
                'stock_quantity': random.randint(10, 500),
                'reorder_level': 20,
                'safety_stock': 10
            })
            inv_id += 1
    df_inv = pd.DataFrame(inventory)

    # Payments
    print("Generating Payments...")
    payments = []
    pay_methods = ['credit_card', 'debit_card', 'upi', 'net_banking']
    pay_id = 1
    for _, row in orders_df.iterrows():
        if row['status'] != 'cancelled':
            payments.append({
                'payment_id': pay_id,
                'order_id': row['order_id'],
                'payment_date': row['order_date'],
                'amount': row['total_amount'],
                'payment_method': random.choices(pay_methods, weights=[25, 15, 50, 10])[0],
                'status': 'completed',
                'transaction_id': f"TXN{fake.uuid4().replace('-', '')[:10].upper()}"
            })
            pay_id += 1
    df_pay = pd.DataFrame(payments)
    
    # Default Users
    import bcrypt
    users = [
        {'user_id': 1, 'username': 'admin', 'email': 'admin@retailiq.com', 'hashed_password': bcrypt.hashpw(b'admin123', bcrypt.gensalt()).decode('utf-8'), 'role': 'admin', 'is_active': True},
        {'user_id': 2, 'username': 'analyst', 'email': 'analyst@retailiq.com', 'hashed_password': bcrypt.hashpw(b'analyst123', bcrypt.gensalt()).decode('utf-8'), 'role': 'analyst', 'is_active': True},
        {'user_id': 3, 'username': 'viewer', 'email': 'viewer@retailiq.com', 'hashed_password': bcrypt.hashpw(b'viewer123', bcrypt.gensalt()).decode('utf-8'), 'role': 'viewer', 'is_active': True}
    ]
    df_users = pd.DataFrame(users)

    # Connect to DB and insert
    print("Loading data into PostgreSQL Database...")
    with engine.begin() as conn:
        conn.execute(text("TRUNCATE TABLE audit_logs, notifications, payments, returns, inventory, order_items, orders, warehouses, products, customers, users, state_demographics CASCADE;"))
        
        df_states.to_sql('state_demographics', conn, if_exists='append', index=False, method='multi', chunksize=1000)
        df_users.to_sql('users', conn, if_exists='append', index=False)
        df_wh.to_sql('warehouses', conn, if_exists='append', index=False)
        df_customers.to_sql('customers', conn, if_exists='append', index=False, method='multi', chunksize=1000)
        
        prod_cols = ['product_id', 'name', 'category', 'sub_category', 'brand', 'price', 'cost_price', 'is_active']
        products[prod_cols].to_sql('products', conn, if_exists='append', index=False, method='multi', chunksize=1000)
        
        order_cols = ['order_id', 'customer_id', 'order_date', 'status', 'shipping_city', 'shipping_state', 'total_amount']
        orders_df[order_cols].to_sql('orders', conn, if_exists='append', index=False, method='multi', chunksize=1000)
        
        oi_cols = ['order_item_id', 'order_id', 'product_id', 'quantity', 'unit_price', 'discount_pct']
        order_items[oi_cols].to_sql('order_items', conn, if_exists='append', index=False, method='multi', chunksize=1000)
        
        df_inv.to_sql('inventory', conn, if_exists='append', index=False, method='multi', chunksize=1000)
        df_pay.to_sql('payments', conn, if_exists='append', index=False, method='multi', chunksize=1000)

    print("Real Indian E-commerce Dataset loaded successfully!")

if __name__ == "__main__":
    main()
