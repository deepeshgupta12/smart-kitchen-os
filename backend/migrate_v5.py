import database
from sqlalchemy import text

def run_migration():
    engine = database.engine
    print("Connecting to database to sync V5.3 columns...")
    
    with engine.connect() as conn:
        try:
            # Adding min_threshold
            conn.execute(text("ALTER TABLE pantry_inventory ADD COLUMN IF NOT EXISTS min_threshold FLOAT DEFAULT 1.0;"))
            # Adding expiry_date
            conn.execute(text("ALTER TABLE pantry_inventory ADD COLUMN IF NOT EXISTS expiry_date DATE;"))
            conn.commit()
            print("✅ Migration Successful: Columns added to pantry_inventory.")
        except Exception as e:
            print(f"❌ Error during migration: {e}")

if __name__ == "__main__":
    run_migration()