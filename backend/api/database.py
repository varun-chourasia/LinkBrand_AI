from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# 1. Define the database file path (it will be created in the 'backend' folder)
DATABASE_URL = "sqlite:///./linkbrand.db"

# 2. Create the engine (The core connection)
# check_same_thread=False is needed for SQLite with FastAPI
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

# 3. Create the Session Local (Used to create database sessions for each request)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4. Base class (All your models will inherit from this)
Base = declarative_base()

# 5. Dependency (We use this in every API endpoint to get a DB session)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()