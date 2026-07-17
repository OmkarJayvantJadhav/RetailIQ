"""
RetailIQ Platform - Data Generation Pipeline
Generates realistic synthetic retail data for Indian context.
"""
import os
import pandas as pd
import numpy as np
from faker import Faker
from datetime import datetime, timedelta
import random

# Fixed seeds for reproducibility
np.random.seed(42)
Faker.seed(42)
random.seed(42)

fake = Faker('en_IN')

# Configuration
NUM_CUSTOMERS = 20000
NUM_PRODUCTS = 1000
NUM_ORDERS = 200000
START_DATE = datetime(2022, 1, 1)
END_DATE = datetime(2024, 12, 31)

DATA_DIR = '../data/raw'
os.makedirs(DATA_DIR, exist_ok=True)

# 1. State Demographics
STATES = [
    {'state': 'Maharashtra', 'population': 112374333, 'literacy_rate': 82.34, 'per_capita_income': 227000, 'region': 'West'},
    {'state': 'Karnataka', 'population': 61095297, 'literacy_rate': 75.36, 'per_capita_income': 236000, 'region': 'South'},
    {'state': 'Tamil Nadu', 'population': 72147030, 'literacy_rate': 80.09, 'per_capita_income': 241000, 'region': 'South'},
    {'state': 'Delhi', 'population': 16787941, 'literacy_rate': 86.21, 'per_capita_income': 400000, 'region': 'North'},
    {'state': 'Uttar Pradesh', 'population': 199812341, 'literacy_rate': 67.68, 'per_capita_income': 70000, 'region': 'North'},
    {'state': 'Gujarat', 'population': 60439692, 'literacy_rate': 78.03, 'per_capita_income': 230000, 'region': 'West'},
    {'state': 'Rajasthan', 'population': 68548437, 'literacy_rate': 66.11, 'per_capita_income': 118000, 'region': 'North'},
    {'state': 'West Bengal', 'population': 91276115, 'literacy_rate': 76.26, 'per_capita_income': 115000, 'region': 'East'},
    {'state': 'Telangana', 'population': 35003674, 'literacy_rate': 66.54, 'per_capita_income': 260000, 'region': 'South'},
    {'state': 'Kerala', 'population': 33406061, 'literacy_rate': 94.00, 'per_capita_income': 220000, 'region': 'South'},
    {'state': 'Madhya Pradesh', 'population': 72626809, 'literacy_rate': 69.32, 'per_capita_income': 105000, 'region': 'Central'},
    {'state': 'Punjab', 'population': 27743338, 'literacy_rate': 75.84, 'per_capita_income': 160000, 'region': 'North'},
    {'state': 'Bihar', 'population': 104099452, 'literacy_rate': 61.80, 'per_capita_income': 46000, 'region': 'East'},
]
df_states = pd.DataFrame(STATES)
df_states.to_csv(f'{DATA_DIR}/state_demographics.csv', index=False)
print("Generated state_demographics.csv")

# 2. Customers
print("Generating customers...")
state_names = df_states['state'].tolist()
state_weights = df_states['population'] / df_states['population'].sum()

incomes = ['Low', 'Medium', 'High', 'Premium']
income_weights = [0.4, 0.35, 0.2, 0.05]

customers = []
for i in range(1, NUM_CUSTOMERS + 1):
    gender = np.random.choice(['Male', 'Female'])
    if gender == 'Male':
        first_name = fake.first_name_male()
    else:
        first_name = fake.first_name_female()
        
    customers.append({
        'customer_id': i,
        'first_name': first_name,
        'last_name': fake.last_name(),
        'email': fake.unique.email(),
        'phone': fake.unique.phone_number()[:15],
        'age': int(np.clip(np.random.normal(35, 12), 18, 90)),
        'gender': gender,
        'city': fake.city(),
        'state': np.random.choice(state_names, p=state_weights),
        'income_level': np.random.choice(incomes, p=income_weights),
        'join_date': fake.date_between(start_date=START_DATE, end_date=END_DATE).strftime('%Y-%m-%d'),
        'is_active': np.random.choice([True, False], p=[0.95, 0.05])
    })
df_customers = pd.DataFrame(customers)
df_customers.to_csv(f'{DATA_DIR}/customers.csv', index=False)

# 3. Products
print("Generating products...")
CATEGORIES = {
    'Electronics': {'subs': ['Smartphones', 'Laptops', 'Audio', 'Wearables'], 'brands': ['Samsung', 'Apple', 'Boat', 'Sony'], 'price_range': (1000, 150000)},
    'Fashion': {'subs': ['Men', 'Women', 'Kids', 'Accessories'], 'brands': ['Fabindia', 'Puma', 'Nike', 'Zara'], 'price_range': (300, 10000)},
    'Grocery': {'subs': ['Snacks', 'Beverages', 'Staples', 'Personal Care'], 'brands': ['Tata', 'ITC', 'Amul', 'Patanjali'], 'price_range': (50, 1000)},
    'Home & Kitchen': {'subs': ['Cookware', 'Decor', 'Furniture', 'Bedding'], 'brands': ['Prestige', 'Bombay Dyeing', 'IKEA', 'Bajaj'], 'price_range': (200, 50000)},
    'Beauty': {'subs': ['Skincare', 'Makeup', 'Haircare', 'Fragrance'], 'brands': ['Lakme', 'Nykaa', 'Mamaearth', 'Loreal'], 'price_range': (150, 5000)},
    'Sports': {'subs': ['Fitness', 'Outdoor', 'Team Sports', 'Equipment'], 'brands': ['Decathlon', 'Nivia', 'Cosco', 'Yonex'], 'price_range': (200, 20000)},
    'Books': {'subs': ['Fiction', 'Non-Fiction', 'Academic', 'Children'], 'brands': ['Penguin', 'Arihant', 'Oxford', 'Rupa'], 'price_range': (100, 2000)},
    'Toys': {'subs': ['Educational', 'Action Figures', 'Board Games', 'Plush'], 'brands': ['Lego', 'Funskool', 'Mattel', 'Hamleys'], 'price_range': (150, 8000)},
    'Automotive': {'subs': ['Accessories', 'Parts', 'Tools', 'Care'], 'brands': ['Bosch', '3M', 'Michelin', 'Godrej'], 'price_range': (100, 15000)},
    'Stationery': {'subs': ['Pens', 'Notebooks', 'Art Supplies', 'Office'], 'brands': ['Classmate', 'Cello', 'Faber-Castell', 'Parker'], 'price_range': (20, 1500)}
}

products = []
for i in range(1, NUM_PRODUCTS + 1):
    cat = np.random.choice(list(CATEGORIES.keys()))
    cat_info = CATEGORIES[cat]
    price = np.round(np.random.uniform(cat_info['price_range'][0], cat_info['price_range'][1]), 2)
    cost_price = np.round(price * np.random.uniform(0.4, 0.75), 2)
    
    products.append({
        'product_id': i,
        'name': f"{np.random.choice(cat_info['brands'])} {np.random.choice(cat_info['subs'])} {fake.word().title()}",
        'category': cat,
        'sub_category': np.random.choice(cat_info['subs']),
        'brand': np.random.choice(cat_info['brands']),
        'price': price,
        'cost_price': cost_price,
        'is_active': np.random.choice([True, False], p=[0.95, 0.05])
    })
df_products = pd.DataFrame(products)
df_products.to_csv(f'{DATA_DIR}/products.csv', index=False)

# 4. Warehouses
print("Generating warehouses...")
WH_CITIES = ['Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Kochi', 'Bhopal', 'Patna', 'Chandigarh', 'Guwahati']
WH_STATES = ['Delhi', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'West Bengal', 'Telangana', 'Maharashtra', 'Gujarat', 'Rajasthan', 'Uttar Pradesh', 'Kerala', 'Madhya Pradesh', 'Bihar', 'Punjab', 'West Bengal'] # Approximate mapping

warehouses = []
for i in range(15):
    warehouses.append({
        'warehouse_id': f'WH{i+1:03d}',
        'name': f"{WH_CITIES[i]} Central Distribution",
        'city': WH_CITIES[i],
        'state': WH_STATES[i],
        'capacity': int(np.random.uniform(5000, 50000)),
        'manager_name': fake.name(),
        'is_active': True
    })
df_warehouses = pd.DataFrame(warehouses)
df_warehouses.to_csv(f'{DATA_DIR}/warehouses.csv', index=False)

# 5. Inventory
print("Generating inventory...")
inventory = []
for _, wh in df_warehouses.iterrows():
    for _, p in df_products.iterrows():
        # Not every warehouse has every product
        if np.random.rand() > 0.3:
            stock = int(np.random.exponential(150))
            if np.random.rand() < 0.05: # 5% chance of low stock
                stock = int(np.random.uniform(0, 10))
            inventory.append({
                'warehouse_id': wh['warehouse_id'],
                'product_id': p['product_id'],
                'stock_quantity': stock,
                'reorder_level': int(np.random.uniform(10, 50)),
                'safety_stock': int(np.random.uniform(5, 20)),
                'last_restocked': fake.date_between(start_date='-60d', end_date='today').strftime('%Y-%m-%d')
            })
df_inventory = pd.DataFrame(inventory)
df_inventory.to_csv(f'{DATA_DIR}/inventory.csv', index=False)

# 6. Orders & Order Items
print("Generating orders and items (this may take a minute)...")
date_range = pd.date_range(START_DATE, END_DATE)
# Festival modifiers (Oct/Nov Diwali, Aug Raksha Bandhan)
seasonality = []
for d in date_range:
    multiplier = 1.0
    if d.month in [10, 11]: multiplier *= 1.5
    if d.month == 8: multiplier *= 1.2
    if d.weekday() >= 5: multiplier *= 1.15
    seasonality.append(multiplier)

seasonality = np.array(seasonality)
seasonality = seasonality / seasonality.sum()

order_dates = np.random.choice(date_range, size=NUM_ORDERS, p=seasonality)

# Pareto distribution for products (20% products make 80% sales)
prod_weights = np.random.pareto(a=2, size=NUM_PRODUCTS)
prod_weights = prod_weights / prod_weights.sum()

orders = []
order_items = []
payments = []
returns = []

customer_ids = df_customers['customer_id'].values
product_ids = df_products['product_id'].values
product_prices = df_products.set_index('product_id')['price'].to_dict()

# Vectorized approach for some parts to speed up
sampled_customers = np.random.choice(customer_ids, size=NUM_ORDERS)
num_items_arr = np.random.choice([1, 2, 3, 4, 5], size=NUM_ORDERS, p=[0.4, 0.3, 0.15, 0.1, 0.05])
order_statuses = np.random.choice(
    ['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'], 
    size=NUM_ORDERS, 
    p=[0.05, 0.05, 0.1, 0.1, 0.65, 0.05]
)
payment_methods = np.random.choice(
    ['credit_card', 'debit_card', 'upi', 'net_banking', 'cod', 'wallet'],
    size=NUM_ORDERS,
    p=[0.2, 0.15, 0.45, 0.07, 0.1, 0.03]
)

item_id_counter = 1
for i in range(NUM_ORDERS):
    order_id = i + 1
    o_date = pd.Timestamp(order_dates[i]).strftime('%Y-%m-%d')
    c_id = sampled_customers[i]
    status = order_statuses[i]
    
    # Generate items
    num_items = num_items_arr[i]
    sampled_prods = np.random.choice(product_ids, size=num_items, p=prod_weights, replace=False)
    
    order_total = 0
    for pid in sampled_prods:
        qty = int(np.random.choice([1, 2, 3, 4, 5], p=[0.6, 0.2, 0.1, 0.05, 0.05]))
        unit_price = product_prices[pid]
        discount = np.random.choice([0, 5, 10, 15, 20, 25, 30], p=[0.5, 0.1, 0.1, 0.1, 0.1, 0.05, 0.05])
        
        line_total = round(qty * unit_price * (1 - discount/100), 2)
        order_total += line_total
        
        order_items.append({
            'order_item_id': item_id_counter,
            'order_id': order_id,
            'product_id': pid,
            'quantity': qty,
            'unit_price': unit_price,
            'discount_pct': discount,
            'line_total': line_total
        })
        
        # Return generation (only for non-cancelled orders, ~5%)
        if status != 'cancelled' and np.random.rand() < 0.05:
            reason = np.random.choice(['Defective', 'Wrong Size', 'Changed Mind', 'Wrong Item', 'Damaged in Transit', 'Quality Issue'])
            return_status = np.random.choice(['pending', 'approved', 'rejected', 'refunded'], p=[0.2, 0.3, 0.1, 0.4])
            returns.append({
                'return_id': len(returns) + 1,
                'order_id': order_id,
                'product_id': pid,
                'return_date': (pd.Timestamp(order_dates[i]) + timedelta(days=int(np.random.uniform(2, 15)))).strftime('%Y-%m-%d'),
                'reason': reason,
                'refund_amount': round(line_total, 2),
                'status': return_status
            })
            
        item_id_counter += 1
        
    orders.append({
        'order_id': order_id,
        'customer_id': c_id,
        'order_date': o_date,
        'status': status,
        'shipping_city': df_customers.loc[df_customers['customer_id'] == c_id, 'city'].values[0],
        'shipping_state': df_customers.loc[df_customers['customer_id'] == c_id, 'state'].values[0],
        'total_amount': round(order_total, 2)
    })
    
    # Payments
    pay_status = 'failed' if status == 'cancelled' else np.random.choice(['pending', 'completed'], p=[0.1, 0.9])
    payments.append({
        'payment_id': order_id,
        'order_id': order_id,
        'payment_date': (pd.Timestamp(order_dates[i]) + timedelta(minutes=int(np.random.uniform(1, 1440)))).strftime('%Y-%m-%d %H:%M:%S'),
        'amount': round(order_total, 2),
        'payment_method': payment_methods[i],
        'status': pay_status,
        'transaction_id': f"TXN{fake.unique.random_number(digits=10)}"
    })

pd.DataFrame(orders).to_csv(f'{DATA_DIR}/orders.csv', index=False)
pd.DataFrame(order_items).to_csv(f'{DATA_DIR}/order_items.csv', index=False)
pd.DataFrame(payments).to_csv(f'{DATA_DIR}/payments.csv', index=False)
pd.DataFrame(returns).to_csv(f'{DATA_DIR}/returns.csv', index=False)

print("Data generation complete! Saved to data/raw/")
