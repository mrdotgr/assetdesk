from pathlib import Path

from sqlalchemy import URL, create_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column

# Find the folder containing this Python script.
SCRIPT_FOLDER = Path(__file__).resolve().parent

# Choose a database filename inside that folder.
DATABASE_PATH = SCRIPT_FOLDER / "table_basics.db"

# Describe the database type and its file location.
DATABASE_URL = URL.create(
    "sqlite",
    database=str(DATABASE_PATH),
)

# Create the object that manages database connections.
engine = create_engine(DATABASE_URL)

class Base(DeclarativeBase):
    """Provide SQLAlchemy's shared foundation for our mapped classes."""


class Asset(Base):
    """Describe the assets table and its columns."""

    __tablename__ = "assets"

    # Give every stored record a unique integer identifier.
    id: Mapped[int] = mapped_column(primary_key=True)

    # Require a value in each of these text columns.
    name: Mapped[str] = mapped_column(nullable=False)
    category: Mapped[str] = mapped_column(nullable=False)
    status: Mapped[str] = mapped_column(nullable=False)

# Create the tables described by our mapped classes if they are missing.
Base.metadata.create_all(engine)

# Create one equipment object in Python's memory.
laptop = Asset(
    name="Demo laptop",
    category="laptop",
    status="available",
)

print("Before saving:", laptop.name, laptop.id)

# Open a session connected to our database.
with Session(engine) as session:
    # Tell this session that we want to save the laptop.
    session.add(laptop)

    # Write the pending change and commit the database transaction.
    session.commit()

    print("After saving:", laptop.name, laptop.id)

# Show where this exercise stores its database.
print("Database file:", DATABASE_PATH)

# Inspect the table description; no database connection is made here.
print("Table:", Asset.__tablename__)
print("Columns:", list(Asset.__table__.columns.keys()))
