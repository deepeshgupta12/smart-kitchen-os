import database
from sqlalchemy import text

def run_v6_migration():
    engine = database.engine
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS name VARCHAR DEFAULT 'User';"))
            conn.execute(text("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS age INTEGER DEFAULT 25;"))
            conn.execute(text("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS weight_kg FLOAT DEFAULT 70.0;"))
            conn.execute(text("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS height_cm FLOAT DEFAULT 175.0;"))
            conn.execute(text("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS gender VARCHAR DEFAULT 'male';"))
            conn.execute(text("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS activity_level VARCHAR DEFAULT 'moderate';"))
            conn.commit()
            print("✅ Migration Successful: UserProfile expanded.")
        except Exception as e:
            print(f"❌ Migration Error: {e}")

if __name__ == "__main__":
    run_v6_migration()