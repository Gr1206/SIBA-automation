from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL.replace("postgres://", "postgresql://", 1),
    connect_args=(
        {"check_same_thread": False}
        if "sqlite" in settings.DATABASE_URL
        else {}
    ),
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def ensure_user_profile_columns():
    columns = {"check_in_time", "check_out_time"}
    existing_columns = {
        column["name"] for column in inspect(engine).get_columns("users")
    }
    missing_columns = columns - existing_columns

    if not missing_columns:
        return

    with engine.begin() as connection:
        for column in missing_columns:
            connection.execute(text(f"ALTER TABLE users ADD COLUMN {column} VARCHAR"))


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()