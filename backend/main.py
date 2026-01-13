from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
import database
import models

# Create all tables in the database on startup
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="SmartKitchen API - V1.2 Database")

@app.get("/")
def read_root():
    return {
        "status": "Healthy",
        "version": "1.2.0",
        "db_status": "Connected & Tables Created",
        "message": "Blinkit-inspired schema initialized"
    }

@app.get("/health")
def health_check(db: Session = Depends(database.get_db)):
    try:
        # Check if the database is actually reachable
        db.execute(models.Base.metadata.tables['dishes'].select().limit(1))
        return {"status": "up and running", "database": "connected"}
    except Exception as e:
        return {"status": "error", "detail": str(e)}