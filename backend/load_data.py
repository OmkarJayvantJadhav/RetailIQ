import os
import pandas as pd
from sqlalchemy import create_engine
import psycopg2
import time

# Use PostgreSQL engine
engine = create_engine('postgresql://neondb_owner:npg_n3NzCYkKsJo1@ep-rapid-bread-azuh1jqx.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require')
DATA_DIR = 'data/raw'

TABLES = [
    ('state_demographics.csv', 'state_demographics'),
    ('customers.csv', 'customers'),
    ('products.csv', 'products'),
    ('warehouses.csv', 'warehouses'),
    ('orders.csv', 'orders'),
    ('order_items.csv', 'order_items'),
    ('inventory.csv', 'inventory'),
    ('returns.csv', 'returns'),
    ('payments.csv', 'payments')
]

def load_data():
    print(f"Connecting to Neon database...")
    try:
        with engine.connect() as conn:
            for csv_file, table_name in TABLES:
                file_path = os.path.join(DATA_DIR, csv_file)
                if not os.path.exists(file_path):
                    print(f"Skipping {table_name}: file not found at {file_path}")
                    continue
                    
                print(f"Loading {table_name}...")
                start_time = time.time()
                df = pd.read_csv(file_path)
                
                # Drop generated columns to avoid Postgres insert errors
                if table_name == 'order_items' and 'line_total' in df.columns:
                    df = df.drop(columns=['line_total'])
                
                # Convert dates if present
                if 'join_date' in df.columns:
                    df['join_date'] = pd.to_datetime(df['join_date'])
                if 'order_date' in df.columns:
                    df['order_date'] = pd.to_datetime(df['order_date'])
                if 'return_date' in df.columns:
                    df['return_date'] = pd.to_datetime(df['return_date'])
                if 'payment_date' in df.columns:
                    df['payment_date'] = pd.to_datetime(df['payment_date'])
                    
                df.to_sql(table_name, engine, if_exists='append', index=False, chunksize=10000, method='multi')
                print(f"Successfully loaded {len(df)} rows into {table_name} in {time.time() - start_time:.2f}s")
                
        print("\nAll data loaded successfully!")
    except Exception as e:
        print(f"Error loading data: {e}")

if __name__ == "__main__":
    load_data()
