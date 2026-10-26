"""Database configuration for AssetDesk."""

from pathlib import Path

from sqlalchemy import URL, create_engine
from sqlalchemy.orm import DeclarativeBase

# Find the project root: the folder containing app/.
PROJECT_ROOT = Path(__file__).resolve().parent.parent

# Keep the application database separate from the learning databases.
DATABASE_PATH = PROJECT_ROOT / "assetdesk.db"

# Tell SQLAlchemy which database system and file to use.
DATABASE_URL = URL.create(
    "sqlite",
    database=str(DATABASE_PATH),
)

# Prepare the object that manages database connections.
engine = create_engine(DATABASE_URL)


class Base(DeclarativeBase):
    """Provide the shared foundation for our database models."""
