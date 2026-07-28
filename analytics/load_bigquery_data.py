import os
import pandas as pd
from google.cloud import bigquery
from sqlalchemy import create_engine, text
import numpy as np
import time

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = os.path.join(os.path.dirname(__file__), '..', 'gcp-service-account.json')

# Use psycopg2 to connect to local Postgres
# In docker-compose, the port exposed to host is 5432
DB_URL = "postgresql+psycopg2://postgres:postgres@localhost:5432/retailiq_db"
engine = create_engine(DB_URL)

bq_client = bigquery.Client()

def run_bq(query):
    print(f"Executing BQ query...\n{query[:100]}...")
    return bq_client.query(query).to_dataframe()

import psycopg2

def reset_schema():
    print("Resetting database schema...")
    schema_path = os.path.join(os.path.dirname(__file__), '..', 'database', 'schema.sql')
    with open(schema_path, 'r', encoding='utf-8') as f:
        schema_sql = f.read()
    
    conn = psycopg2.connect("dbname=retailiq_db user=postgres password=postgres host=localhost port=5432")
    conn.autocommit = True
    with conn.cursor() as cur:
        cur.execute(schema_sql)
    conn.close()

def extract_and_load():
    reset_schema()
    
    print("Extracting users...")
    df_users = run_bq("""
        SELECT id, first_name, last_name, email, age, gender, state, city, created_at
        FROM `bigquery-public-data.thelook_ecommerce.users`
        LIMIT 1000
    """)
    # Map to customers table
    customers_df = pd.DataFrame({
        'customer_id': df_users['id'],
        'first_name': df_users['first_name'],
        'last_name': df_users['last_name'],
        'email': df_users['email'],
        'phone': '555-' + df_users['id'].astype(str).str.zfill(4),
        'age': df_users['age'].clip(lower=18, upper=90),
        'gender': df_users['gender'].map({'M': 'Male', 'F': 'Female'}).fillna('Other'),
        'income_level': 'Medium', # The Look doesn't have income, default it
        'join_date': df_users['created_at'],
        'is_active': True,
        'city': df_users['city'],
        'state': df_users['state']
    })
    
    # Fill income with pseudo-random distribution based on age
    np.random.seed(42)
    incomes = ['Low', 'Medium', 'High']
    customers_df['income_level'] = np.random.choice(incomes, size=len(customers_df), p=[0.2, 0.6, 0.2])

    print("Extracting state demographics...")
    states = list(df_users['state'].unique()) + ['Unknown']
    states_df = pd.DataFrame({
        'state': states,
        'population': 10000000,
        'literacy_rate': 85.0,
        'per_capita_income': 60000.0,
        'region': 'Central'
    })

    print("Extracting products...")
    df_products = run_bq("""
        SELECT id, name, category, department, cost, retail_price
        FROM `bigquery-public-data.thelook_ecommerce.products`
        LIMIT 2000
    """)
    products_df = pd.DataFrame({
        'product_id': df_products['id'],
        'name': df_products['name'].fillna("Unknown Product"),
        'category': df_products['category'],
        'sub_category': df_products['department'],
        'cost_price': df_products['cost'],
        'price': df_products['retail_price']
    })
    
    print("Extracting distribution centers...")
    df_dc = run_bq("""
        SELECT id, name, latitude, longitude
        FROM `bigquery-public-data.thelook_ecommerce.distribution_centers`
    """)
    warehouses_df = pd.DataFrame({
        'warehouse_id': df_dc['id'].astype(str),
        'name': df_dc['name'],
        'city': 'Unknown',
        'state': 'Unknown',
        'capacity': 100000
    })

    print("Extracting inventory_items...")
    # Get aggregated stock counts for the products we pulled
    p_ids = ','.join(products_df['product_id'].astype(str))
    df_inv = run_bq(f"""
        SELECT product_id, product_distribution_center_id, COUNT(id) as stock
        FROM `bigquery-public-data.thelook_ecommerce.inventory_items`
        WHERE product_id IN ({p_ids}) AND sold_at IS NULL
        GROUP BY product_id, product_distribution_center_id
    """)
    inventory_df = pd.DataFrame({
        'warehouse_id': df_inv['product_distribution_center_id'].astype(str),
        'product_id': df_inv['product_id'],
        'stock_quantity': df_inv['stock'],
        'reorder_level': df_inv['stock'].apply(lambda x: max(2, int(x * 0.2))),
        'safety_stock': df_inv['stock'].apply(lambda x: max(1, int(x * 0.1)))
    })
    
    print("Extracting orders & items...")
    c_ids = ','.join(customers_df['customer_id'].astype(str))
    df_orders = run_bq(f"""
        SELECT order_id, user_id, status, created_at, num_of_item
        FROM `bigquery-public-data.thelook_ecommerce.orders`
        WHERE user_id IN ({c_ids})
        LIMIT 5000
    """)
    
    if df_orders.empty:
        print("WARNING: No orders found for these users. Attempting fallback query...")
        df_orders = run_bq("""
            SELECT order_id, user_id, status, created_at, num_of_item
            FROM `bigquery-public-data.thelook_ecommerce.orders`
            LIMIT 5000
        """)
        # Must ensure users exist
        missing_users = set(df_orders['user_id']) - set(customers_df['customer_id'])
        if missing_users:
            m_ids = ','.join(map(str, missing_users))
            df_missing_users = run_bq(f"SELECT id, first_name, last_name, email, age, gender, state, city, created_at FROM `bigquery-public-data.thelook_ecommerce.users` WHERE id IN ({m_ids})")
            extra_cust = pd.DataFrame({
                'customer_id': df_missing_users['id'],
                'first_name': df_missing_users['first_name'],
                'last_name': df_missing_users['last_name'],
                'email': df_missing_users['email'],
                'phone': '555-0000',
                'age': df_missing_users['age'].clip(lower=18, upper=90),
                'gender': df_missing_users['gender'].map({'M': 'Male', 'F': 'Female'}).fillna('Other'),
                'income_level': 'Medium',
                'join_date': df_missing_users['created_at'],
                'is_active': True,
                'city': df_missing_users['city'],
                'state': df_missing_users['state']
            })
            customers_df = pd.concat([customers_df, extra_cust])
            
            new_states = set(df_missing_users['state']) - set(states_df['state'])
            if new_states:
                extra_states = pd.DataFrame({
                    'state': list(new_states),
                    'population': 10000000,
                    'literacy_rate': 85.0,
                    'per_capita_income': 60000.0,
                    'region': 'Central'
                })
                states_df = pd.concat([states_df, extra_states])
            
    o_ids = ','.join(df_orders['order_id'].astype(str))
    df_order_items = run_bq(f"""
        SELECT id, order_id, product_id, sale_price
        FROM `bigquery-public-data.thelook_ecommerce.order_items`
        WHERE order_id IN ({o_ids})
    """)
    
    # Must ensure products exist
    missing_products = set(df_order_items['product_id']) - set(products_df['product_id'])
    if missing_products:
        p_ids_m = ','.join(map(str, missing_products))
        df_missing_products = run_bq(f"SELECT id, name, category, department, cost, retail_price FROM `bigquery-public-data.thelook_ecommerce.products` WHERE id IN ({p_ids_m})")
        extra_prod = pd.DataFrame({
            'product_id': df_missing_products['id'],
            'name': df_missing_products['name'].fillna("Unknown Product"),
            'category': df_missing_products['category'],
            'sub_category': df_missing_products['department'],
            'cost_price': df_missing_products['cost'],
            'price': df_missing_products['retail_price']
        })
        products_df = pd.concat([products_df, extra_prod])

    # Aggregate total amount for orders
    order_totals = df_order_items.groupby('order_id')['sale_price'].sum().to_dict()
    df_orders['total_amount'] = df_orders['order_id'].map(order_totals).fillna(0)
    
    user_city_map = customers_df.set_index('customer_id')['city'].to_dict()
    user_state_map = customers_df.set_index('customer_id')['state'].to_dict()

    orders_df = pd.DataFrame({
        'order_id': df_orders['order_id'],
        'customer_id': df_orders['user_id'],
        'order_date': df_orders['created_at'],
        'status': df_orders['status'].apply(lambda x: 'delivered' if x == 'Complete' else ('shipped' if x == 'Shipped' else ('cancelled' if x == 'Cancelled' else 'processing'))),
        'shipping_city': df_orders['user_id'].map(user_city_map).fillna('Unknown'),
        'shipping_state': df_orders['user_id'].map(user_state_map).fillna('Unknown'),
        'total_amount': df_orders['total_amount']
    })
    
    order_items_df = pd.DataFrame({
        'order_item_id': df_order_items['id'],
        'order_id': df_order_items['order_id'],
        'product_id': df_order_items['product_id'],
        'quantity': 1, # The Look dataset stores 1 item per row
        'unit_price': df_order_items['sale_price'],
        'discount_pct': 0.0
    })

    print("Generating mock payments...")
    np.random.seed(42)
    payment_methods = ['credit_card', 'wallet', 'debit_card', 'upi']
    payments_df = pd.DataFrame({
        'payment_id': range(1, len(orders_df) + 1),
        'order_id': orders_df['order_id'],
        'amount': orders_df['total_amount'],
        'payment_method': np.random.choice(payment_methods, size=len(orders_df), p=[0.5, 0.2, 0.2, 0.1]),
        'status': 'completed',
        'transaction_id': [f"TXN-{i}" for i in range(1, len(orders_df) + 1)],
        'payment_date': orders_df['order_date']
    })

    print("Loading to database...")
    with engine.begin() as conn:
        states_df.to_sql('state_demographics', conn, if_exists='append', index=False)
        customers_df.to_sql('customers', conn, if_exists='append', index=False)
        products_df.to_sql('products', conn, if_exists='append', index=False)
        warehouses_df.to_sql('warehouses', conn, if_exists='append', index=False)
        inventory_df.to_sql('inventory', conn, if_exists='append', index=False)
        orders_df.to_sql('orders', conn, if_exists='append', index=False)
        order_items_df.to_sql('order_items', conn, if_exists='append', index=False)
        payments_df.to_sql('payments', conn, if_exists='append', index=False)

    print("Data loaded successfully!")

if __name__ == "__main__":
    extract_and_load()
