import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Explicitly point to the .env file in the current directory
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# Debug print to catch the 'None' error before SQLAlchemy crashes
if SQLALCHEMY_DATABASE_URL is None:
    print("ERROR: DATABASE_URL not found in environment variables!")
    # Temporary fallback for local dev if .env fails
    SQLALCHEMY_DATABASE_URL = "postgresql://postgres:your_secure_password@localhost:5432/smart_kitchen"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()