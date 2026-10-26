"""Database models for AssetDesk."""

from datetime import datetime
from zoneinfo import ZoneInfo

from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def current_greek_time() -> str:
    """Return the current Greek time with its UTC offset."""
    return datetime.now(ZoneInfo("Europe/Athens")).isoformat(
        timespec="seconds"
    )


class Asset(Base):
    """An equipment record in the assets table."""

    __tablename__ = "assets"

    id: Mapped[int] = mapped_column(primary_key=True)

    name_alias: Mapped[str] = mapped_column(nullable=False)
    category: Mapped[str] = mapped_column(nullable=False)
    brand: Mapped[str] = mapped_column(nullable=False)

    # A serial number may be missing, but provided numbers must be unique.
    serial_number: Mapped[str | None] = mapped_column(
        nullable=True,
        unique=True,
    )

    # Use available when an insert does not supply a status.
    status: Mapped[str] = mapped_column(
        nullable=False,
        default="available",
    )

    # Store an ISO-formatted timestamp including the Greek UTC offset.
    created_at: Mapped[str] = mapped_column(
        nullable=False,
        default=current_greek_time,
    )
