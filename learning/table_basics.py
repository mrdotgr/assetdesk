from pathlib import Path

from sqlalchemy import URL, create_engine, select
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

    # These text columns cannot contain SQL NULL.
    name: Mapped[str] = mapped_column(nullable=False)
    category: Mapped[str] = mapped_column(nullable=False)
    status: Mapped[str] = mapped_column(nullable=False)


# Create missing tables without deleting existing records.
Base.metadata.create_all(engine)

# Ask whether this run should save another fictional laptop.
answer = input("Save a new demo laptop? Type yes or no: ")

# Everything inside this block runs only when the answer is "yes".
if answer == "yes":
    # Create one equipment object in Python's memory.
    laptop = Asset(
        name="Demo laptop",
        category="laptop",
        status="available",
    )

    print("Before saving:", laptop.name, laptop.id)

    # Save the new object as a database record.
    with Session(engine) as session:
        session.add(laptop)
        session.commit()

        print("After saving:", laptop.name, laptop.id)

# These instructions are outside the if, so they run either way.
print("Database file:", DATABASE_PATH)

# Display the table description defined by our mapped class.
print("Table:", Asset.__tablename__)
print("Columns:", list(Asset.__table__.columns.keys()))

# Read saved equipment whether or not we added a new laptop.
with Session(engine) as session:
    # Describe the request.
    statement = select(Asset).order_by(Asset.id)

    # Execute the request and collect the objects in a list.
    assets = session.scalars(statement).all()

    # Display the number of returned objects.
    print("Stored assets:", len(assets))

    # Display each object's information.
    for asset in assets:
        print(asset.id, asset.name, asset.category, asset.status)
