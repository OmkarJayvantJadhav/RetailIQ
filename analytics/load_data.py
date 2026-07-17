"""
RetailIQ Platform - Data Loading Pipeline
Loads generated CSVs into PostgreSQL.
"""
import os
import pandas as pd
from sqlalchemy import create_engine
import psycopg2
from dotenv import load_dotenv

load_dotenv('../.env')

DB_USER = os.getenv('DB_USER', 'postgres')
DB_PASS = os.getenv('DB_PASSWORD', 'postgres')
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = os.getenv('DB_PORT', '5432')
DB_NAME = os.getenv('DB_NAME', 'retailiq_db')

engine = create_engine(f'sqlite:///../backend/retailiq.db')
DATA_DIR = '../data/raw'

# Ordered list of tables to load (respecting Foreign Keys)
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
    print(f"Connecting to database {DB_NAME}...")
    try:
        with engine.connect() as conn:
            for csv_file, table_name in TABLES:
                file_path = os.path.join(DATA_DIR, csv_file)
                if not os.path.exists(file_path):
                    print(f"Skipping {table_name}: file not found")
                    continue
                    
                print(f"Loading {table_name}...")
                df = pd.read_csv(file_path)
                
                # Convert dates if present
                if 'join_date' in df.columns:
                    df['join_date'] = pd.to_datetime(df['join_date'])
                if 'order_date' in df.columns:
                    df['order_date'] = pd.to_datetime(df['order_date'])
                if 'return_date' in df.columns:
                    df['return_date'] = pd.to_datetime(df['return_date'])
                if 'payment_date' in df.columns:
                    df['payment_date'] = pd.to_datetime(df['payment_date'])
                    
                df.to_sql(table_name, engine, if_exists='append', index=False, chunksize=10000)
                print(f"Successfully loaded {len(df)} rows into {table_name}")
                
        print("\nAll data loaded successfully!")
    except Exception as e:
        print(f"Error loading data: {e}")

if __name__ == "__main__":
    load_data()
