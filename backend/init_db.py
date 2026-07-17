import os
from sqlalchemy.orm import Session
from app.db.database import engine, SessionLocal, Base
from app.models.all import User
from app.core.security import get_password_hash

def init_db():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    
    print("Seeding initial users...")
    db = SessionLocal()
    
    users = [
        {"username": "admin", "email": "admin@retailiq.com", "role": "admin", "full_name": "System Admin"},
        {"username": "analyst", "email": "analyst@retailiq.com", "role": "analyst", "full_name": "Data Analyst"},
        {"username": "viewer", "email": "viewer@retailiq.com", "role": "viewer", "full_name": "Executive Viewer"}
    ]
    
    for u in users:
        existing = db.query(User).filter(User.username == u["username"]).first()
        if not existing:
            user = User(
                username=u["username"],
                email=u["email"],
                hashed_password=get_password_hash(u["username"] + "123"), # admin123 etc
                role=u["role"],
                full_name=u["full_name"]
            )
            db.add(user)
    
    db.commit()
    db.close()
    print("Database initialization complete.")

if __name__ == "__main__":
    # We load env if needed
    init_db()
