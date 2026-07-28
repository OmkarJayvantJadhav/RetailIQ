import os
import pandas as pd
import numpy as np
from sqlalchemy import create_engine
from google.cloud import bigquery
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '../backend/.env'))

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = os.path.join(os.path.dirname(__file__), '..', 'gcp-service-account.json')

db_url = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/retailiq_db")
# When running locally from host, the port maps to localhost
if "postgres:5432" in db_url:
    db_url = db_url.replace("postgres:5432", "localhost:5432")

engine = create_engine(db_url)
client = bigquery.Client()

def run_bq(query):
    return client.query(query).to_dataframe()

def extract_and_load_full():
    print("Extracting full users table...")
    df_users = run_bq("""
        SELECT id, first_name, last_name, email, age, gender, state, city, created_at
        FROM `bigquery-public-data.thelook_ecommerce.users`
    """)
    customers_df = pd.DataFrame({
        'customer_id': df_users['id'],
        'first_name': df_users['first_name'],
        'last_name': df_users['last_name'],
        'email': df_users['email'],
        'phone': '555-' + df_users['id'].astype(str).str.zfill(4),
        'age': df_users['age'].clip(lower=18, upper=90),
        'gender': df_users['gender'].map({'M': 'Male', 'F': 'Female'}).fillna('Other'),
        'join_date': df_users['created_at'],
        'is_active': True,
        'city': df_users['city'],
        'state': df_users['state']
    })
    
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

    print("Extracting full products table...")
    df_products = run_bq("""
        SELECT id, name, category, department, cost, retail_price
        FROM `bigquery-public-data.thelook_ecommerce.products`
    """)
    products_df = pd.DataFrame({
        'product_id': df_products['id'],
        'name': df_products['name'].fillna("Unknown Product"),
        'category': df_products['category'],
        'sub_category': df_products['department'],
        'cost_price': df_products['cost'],
        'price': df_products['retail_price']
    })
    
    print("Extracting full distribution centers...")
    df_dc = run_bq("""
        SELECT id, name
        FROM `bigquery-public-data.thelook_ecommerce.distribution_centers`
    """)
    warehouses_df = pd.DataFrame({
        'warehouse_id': df_dc['id'].astype(str),
        'name': df_dc['name'],
        'city': 'Unknown',
        'state': 'Unknown',
        'capacity': 100000
    })

    print("Extracting full inventory_items table (unsold stock)...")
    df_inv = run_bq("""
        SELECT product_id, product_distribution_center_id, COUNT(id) as stock
        FROM `bigquery-public-data.thelook_ecommerce.inventory_items`
        WHERE sold_at IS NULL
        GROUP BY product_id, product_distribution_center_id
    """)
    inventory_df = pd.DataFrame({
        'warehouse_id': df_inv['product_distribution_center_id'].astype(str),
        'product_id': df_inv['product_id'],
        'stock_quantity': df_inv['stock'],
        'reorder_level': df_inv['stock'].apply(lambda x: max(2, int(x * 0.2))),
        'safety_stock': df_inv['stock'].apply(lambda x: max(1, int(x * 0.1)))
    })
    
    print("Extracting full orders table...")
    df_orders = run_bq("""
        SELECT order_id, user_id, status, created_at
        FROM `bigquery-public-data.thelook_ecommerce.orders`
    """)
    
    print("Extracting full order_items table...")
    df_order_items = run_bq("""
        SELECT id, order_id, product_id, sale_price
        FROM `bigquery-public-data.thelook_ecommerce.order_items`
    """)

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
        'quantity': 1,
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

    print("Loading to database (this may take a few minutes)...")
    with engine.begin() as conn:
        states_df.to_sql('state_demographics', conn, if_exists='append', index=False, chunksize=10000, method='multi')
        print("Loaded states.")
        customers_df.to_sql('customers', conn, if_exists='append', index=False, chunksize=10000, method='multi')
        print("Loaded customers.")
        products_df.to_sql('products', conn, if_exists='append', index=False, chunksize=10000, method='multi')
        print("Loaded products.")
        warehouses_df.to_sql('warehouses', conn, if_exists='append', index=False, chunksize=10000, method='multi')
        print("Loaded warehouses.")
        inventory_df.to_sql('inventory', conn, if_exists='append', index=False, chunksize=10000, method='multi')
        print("Loaded inventory.")
        orders_df.to_sql('orders', conn, if_exists='append', index=False, chunksize=10000, method='multi')
        print("Loaded orders.")
        order_items_df.to_sql('order_items', conn, if_exists='append', index=False, chunksize=10000, method='multi')
        print("Loaded order items.")
        payments_df.to_sql('payments', conn, if_exists='append', index=False, chunksize=10000, method='multi')
        print("Loaded payments.")

    print("Data loaded successfully!")

if __name__ == "__main__":
    extract_and_load_full()
