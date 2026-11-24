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


def ensure_submission_tracking_columns():
    if "submissions" not in inspect(engine).get_table_names():
        return

    existing_columns = {
        column["name"] for column in inspect(engine).get_columns("submissions")
    }
    if "reservation_id" not in existing_columns:
        with engine.begin() as connection:
            connection.execute(
                text("ALTER TABLE submissions ADD COLUMN reservation_id INTEGER")
            )

    with engine.begin() as connection:
        duplicate_file_numbers = connection.execute(
            text(
                "SELECT COUNT(*) FROM ("
                "SELECT user_id, file_number FROM submissions "
                "GROUP BY user_id, file_number HAVING COUNT(*) > 1"
                ")"
            )
        ).scalar_one()
        if duplicate_file_numbers:
            raise RuntimeError(
                "Cannot enable unique SIBA file numbers: existing duplicate "
                "submissions need manual reconciliation."
            )
        connection.execute(
            text(
                "CREATE UNIQUE INDEX IF NOT EXISTS "
                "uq_submissions_active_reservation "
                "ON submissions (user_id, reservation_id) "
                "WHERE status IN ('Sending', 'Unknown')"
            )
        )
        connection.execute(
            text(
                "CREATE UNIQUE INDEX IF NOT EXISTS "
                "uq_submissions_user_file_number "
                "ON submissions (user_id, file_number)"
            )
        )


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()