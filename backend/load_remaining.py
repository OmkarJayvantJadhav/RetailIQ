import os
import pandas as pd
from sqlalchemy import create_engine
import time

DB_USER = os.getenv('DB_USER', 'postgres')
DB_PASS = os.getenv('DB_PASSWORD', 'postgres')
DB_HOST = os.getenv('DB_HOST', 'postgres')
DB_PORT = os.getenv('DB_PORT', '5432')
DB_NAME = os.getenv('DB_NAME', 'retailiq_db')

engine = create_engine(f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}")
DATA_DIR = 'data/raw'

TABLES = [
    ('returns.csv', 'returns'),
    ('payments.csv', 'payments')
]

def load_data():
    with engine.connect() as conn:
        for csv_file, table_name in TABLES:
            file_path = os.path.join(DATA_DIR, csv_file)
            print(f"Loading {table_name}...")
            start_time = time.time()
            df = pd.read_csv(file_path)
            
            if 'return_date' in df.columns:
                df['return_date'] = pd.to_datetime(df['return_date'])
            if 'payment_date' in df.columns:
                df['payment_date'] = pd.to_datetime(df['payment_date'])
                
            df.to_sql(table_name, engine, if_exists='append', index=False, chunksize=10000, method='multi')
            print(f"Successfully loaded {len(df)} rows into {table_name} in {time.time() - start_time:.2f}s")

if __name__ == '__main__':
    load_data()
