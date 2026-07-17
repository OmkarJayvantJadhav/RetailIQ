import os
import pandas as pd
import numpy as np
from faker import Faker
import random
from datetime import datetime, timedelta

print("Initializing Indian Faker...")
fake = Faker('en_IN')

np.random.seed(42)
random.seed(42)
Faker.seed(42)

DATA_DIR = 'data/raw'
os.makedirs(DATA_DIR, exist_ok=True)

# 1. State Demographics (Indian States)
states = [
    ("Maharashtra", 125000000, 85.0, 200000.0, "West"),
    ("Karnataka", 68000000, 75.0, 220000.0, "South"),
    ("Delhi", 31000000, 88.0, 300000.0, "North"),
    ("Tamil Nadu", 78000000, 80.0, 210000.0, "South"),
    ("Gujarat", 65000000, 78.0, 190000.0, "West"),
    ("Telangana", 38000000, 72.0, 205000.0, "South"),
    ("Uttar Pradesh", 225000000, 68.0, 70000.0, "North"),
    ("West Bengal", 98000000, 76.0, 100000.0, "East"),
    ("Rajasthan", 77000000, 66.0, 110000.0, "North"),
    ("Kerala", 35000000, 94.0, 180000.0, "South"),
    ("Haryana", 28000000, 76.0, 230000.0, "North"),
    ("Punjab", 30000000, 75.0, 160000.0, "North"),
    ("Madhya Pradesh", 82000000, 69.0, 90000.0, "Central"),
    ("Andhra Pradesh", 53000000, 67.0, 150000.0, "South"),
    ("Bihar", 120000000, 61.0, 50000.0, "East")
]
df_states = pd.DataFrame(states, columns=['state', 'population', 'literacy_rate', 'per_capita_income', 'region'])
df_states.to_csv(f"{DATA_DIR}/state_demographics.csv", index=False)
print("Generated state_demographics.csv")
state_names = [s[0] for s in states]

# 2. Customers
NUM_CUSTOMERS = 20000
customers = []
income_levels = ['Low', 'Medium', 'High', 'Premium']

for i in range(NUM_CUSTOMERS):
    customers.append({
        'customer_id': i + 1,
        'first_name': fake.first_name(),
        'last_name': fake.last_name(),
        'email': fake.email(),
        'phone': fake.phone_number(),
        'age': random.randint(18, 70),
        'gender': np.random.choice(['Male', 'Female', 'Other'], p=[0.48, 0.48, 0.04]),
        'city': fake.city(),
        'state': random.choice(state_names),
        'income_level': np.random.choice(income_levels, p=[0.4, 0.4, 0.15, 0.05]),
        'join_date': fake.date_between(start_date='-2y', end_date='today').isoformat(),
        'is_active': True
    })

pd.DataFrame(customers).to_csv(f"{DATA_DIR}/customers.csv", index=False)

# 3. Warehouses
warehouses = [
    {'warehouse_id': f'WH{i:03d}', 'name': f'{city} Distribution Center', 'city': city, 'state': state, 'capacity': random.randint(10000, 50000), 'manager_name': fake.name(), 'is_active': True}
    for i, (city, state) in enumerate([
        ('Mumbai', 'Maharashtra'), ('Pune', 'Maharashtra'),
        ('Bengaluru', 'Karnataka'), ('Mysuru', 'Karnataka'),
        ('New Delhi', 'Delhi'), ('Chennai', 'Tamil Nadu'),
        ('Ahmedabad', 'Gujarat'), ('Hyderabad', 'Telangana'),
        ('Lucknow', 'Uttar Pradesh'), ('Kolkata', 'West Bengal')
    ], start=1)
]
pd.DataFrame(warehouses).to_csv(f"{DATA_DIR}/warehouses.csv", index=False)

# 4. Products
NUM_PRODUCTS = 1000
categories = {
    'Groceries': [('Tata Sampann', 50, 500), ('Aashirvaad', 100, 800), ('Fortune', 150, 1000), ('Amul', 20, 400), ('Britannia', 10, 200)],
    'Electronics': [('Boat', 800, 4000), ('Noise', 1000, 5000), ('Croma', 2000, 40000), ('Reliance Digital', 1500, 50000)],
    'Apparel': [('FabIndia', 1000, 5000), ('Biba', 800, 4000), ('Manyavar', 2000, 15000), ('Pantaloons', 500, 3000)],
    'Beauty': [('Lakme', 200, 1500), ('Nykaa', 300, 2000), ('Biotique', 150, 800), ('Himalaya', 80, 500)],
    'Home': [('Bombay Dyeing', 800, 4000), ('Nilkamal', 1000, 8000), ('Godrej Interio', 5000, 50000), ('Cello', 100, 1500)]
}

products = []
for i in range(NUM_PRODUCTS):
    cat = random.choice(list(categories.keys()))
    brand_info = random.choice(categories[cat])
    brand_name, min_p, max_p = brand_info[0], brand_info[1], brand_info[2]
    
    sub_cats = {
        'Groceries': ['Atta', 'Rice', 'Dal', 'Oil', 'Spices'],
        'Electronics': ['Headphones', 'Smartwatch', 'AC', 'Refrigerator'],
        'Apparel': ['Kurta', 'Saree', 'Shirt', 'Trousers'],
        'Beauty': ['Lipstick', 'Face Wash', 'Moisturizer', 'Shampoo'],
        'Home': ['Bedsheet', 'Chair', 'Container Set', 'Water Bottle']
    }
    
    sub_cat = random.choice(sub_cats[cat])
    prod_name = f"{brand_name} {sub_cat} {fake.word().capitalize()}"
    
    price = round(random.uniform(min_p, max_p), 2)
    products.append({
        'product_id': i + 1,
        'name': prod_name[:50],
        'category': cat,
        'sub_category': sub_cat,
        'brand': brand_name,
        'price': price,
        'cost_price': round(price * random.uniform(0.4, 0.8), 2),
        'is_active': True
    })

pd.DataFrame(products).to_csv(f"{DATA_DIR}/products.csv", index=False)

# 5. Inventory
inventory = []
for w in warehouses:
    stocked_products = random.sample(products, int(NUM_PRODUCTS * 0.6))
    for p in stocked_products:
        inventory.append({
            'warehouse_id': w['warehouse_id'],
            'product_id': p['product_id'],
            'stock_quantity': random.randint(0, 1000),
            'reorder_level': random.randint(20, 100),
            'safety_stock': random.randint(5, 20)
        })
pd.DataFrame(inventory).to_csv(f"{DATA_DIR}/inventory.csv", index=False)

# 6. Orders & Items
NUM_ORDERS = 200000
end_date = datetime.now()
start_date = end_date - timedelta(days=365*2)

orders = []
order_items = []
order_item_id = 1

dates = [start_date + timedelta(days=i) for i in range((end_date - start_date).days)]
weights = np.linspace(0.5, 1.5, len(dates))
weights = weights / weights.sum()

order_dates = np.random.choice(dates, size=NUM_ORDERS, p=weights)
customer_ids = np.random.randint(1, NUM_CUSTOMERS + 1, size=NUM_ORDERS)

for i in range(NUM_ORDERS):
    order_id = i + 1
    status = np.random.choice(['completed', 'cancelled', 'processing'], p=[0.95, 0.02, 0.03])
    
    order = {
        'order_id': order_id,
        'customer_id': customer_ids[i],
        'order_date': order_dates[i].strftime('%Y-%m-%d %H:%M:%S'),
        'status': status,
        'shipping_city': fake.city(),
        'shipping_state': random.choice(state_names),
        'total_amount': 0
    }
    
    total = 0
    num_items = np.random.choice([1, 2, 3, 4, 5], p=[0.4, 0.3, 0.15, 0.1, 0.05])
    selected_products = random.sample(products, num_items)
    
    for p in selected_products:
        qty = random.randint(1, 3)
        price = p['price']
        subtotal = qty * price
        total += subtotal
        
        order_items.append({
            'order_item_id': order_item_id,
            'order_id': order_id,
            'product_id': p['product_id'],
            'quantity': qty,
            'unit_price': price,
            'discount_pct': 0,
            'line_total': subtotal
        })
        order_item_id += 1
        
    order['total_amount'] = round(total, 2)
    orders.append(order)

pd.DataFrame(orders).to_csv(f"{DATA_DIR}/orders.csv", index=False)
pd.DataFrame(order_items).to_csv(f"{DATA_DIR}/order_items.csv", index=False)

# 7. Payments
payments = []
for o in orders:
    if o['status'] != 'cancelled':
        payment_status = 'completed' if o['status'] == 'completed' else np.random.choice(['completed', 'pending'], p=[0.8, 0.2])
        payments.append({
            'order_id': o['order_id'],
            'payment_date': (datetime.strptime(o['order_date'], '%Y-%m-%d %H:%M:%S') + timedelta(hours=random.randint(0, 48))).strftime('%Y-%m-%d %H:%M:%S'),
            'amount': o['total_amount'],
            'payment_method': np.random.choice(['UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'COD'], p=[0.45, 0.25, 0.15, 0.05, 0.10]),
            'status': payment_status,
            'transaction_id': f"TXN{fake.uuid4()[:8].upper()}"
        })
pd.DataFrame(payments).to_csv(f"{DATA_DIR}/payments.csv", index=False)

# 8. Returns
returns = []
return_id = 1
delivered_items = [item for item in order_items if orders[item['order_id']-1]['status'] == 'completed']

# 3% of items returned
returned_items = random.sample(delivered_items, int(len(delivered_items) * 0.03))

for row in returned_items:
    order_date = orders[row['order_id']-1]['order_date']
    return_date = datetime.strptime(order_date, '%Y-%m-%d %H:%M:%S') + timedelta(days=random.randint(2, 14))
    
    returns.append({
        'return_id': return_id,
        'order_id': row['order_id'],
        'product_id': row['product_id'],
        'return_date': return_date.strftime('%Y-%m-%d %H:%M:%S'),
        'reason': np.random.choice(['Defective', 'Wrong Item', 'Not Needed', 'Size Issue'], p=[0.3, 0.2, 0.1, 0.4]),
        'refund_amount': row['unit_price'],
        'status': np.random.choice(['completed', 'pending'], p=[0.8, 0.2])
    })
    return_id += 1

pd.DataFrame(returns).to_csv(f"{DATA_DIR}/returns.csv", index=False)
print("Corrected Indian data generation complete!")
