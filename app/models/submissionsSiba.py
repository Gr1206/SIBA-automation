
from datetime import UTC, datetime
from app.db.session import Base
from sqlalchemy import Column, DateTime, ForeignKey, Index, Integer, String, text

class Submission(Base):
    __tablename__ = "submissions"
    __table_args__ = (
        Index(
            "uq_submissions_active_reservation",
            "user_id",
            "reservation_id",
            unique=True,
            sqlite_where=text("status IN ('Sending', 'Unknown')"),
            postgresql_where=text("status IN ('Sending', 'Unknown')"),
        ),
        Index(
            "uq_submissions_user_file_number",
            "user_id",
            "file_number",
            unique=True,
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    reservation_id = Column(Integer, nullable=True)
    file_number = Column(Integer, nullable=False)
    submission_date = Column(
        DateTime,
        default=lambda: datetime.now(UTC).replace(tzinfo=None),
    )
    status = Column(String, default="pending")
    response_code = Column(String, nullable=True)

    