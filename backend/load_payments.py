import pandas as pd
from sqlalchemy import create_engine
engine = create_engine('postgresql://postgres:postgres@postgres:5432/retailiq_db')
df = pd.read_csv('data/raw/payments.csv')
df['payment_date'] = pd.to_datetime(df['payment_date'])
df.to_sql('payments', engine, if_exists='append', index=False, chunksize=10000, method='multi')
print("Successfully loaded payments!")
