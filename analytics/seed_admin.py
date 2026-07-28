import bcrypt
import pandas as pd
from sqlalchemy import create_engine

# Database Connection
DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/retailiq_db"
engine = create_engine(DATABASE_URL)

def seed_admin():
    users = [
        {'username': 'admin', 'email': 'admin@retailiq.com', 'hashed_password': bcrypt.hashpw(b'admin123', bcrypt.gensalt()).decode('utf-8'), 'role': 'admin', 'is_active': True},
    ]
    df_users = pd.DataFrame(users)
    
    with engine.begin() as conn:
        df_users.to_sql('users', conn, if_exists='append', index=False)
    print("Admin user seeded successfully!")

if __name__ == "__main__":
    seed_admin()
