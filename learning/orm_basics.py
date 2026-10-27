"""Practice saving and reading fictional equipment with SQLAlchemy."""

import argparse
from pathlib import Path

from sqlalchemy import URL, create_engine, select
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column

# Locate the database beside this script, regardless of terminal location.
DATABASE_PATH = Path(__file__).resolve().parent / "learning.db"
DATABASE_URL = URL.create("sqlite", database=str(DATABASE_PATH))

# The engine manages connections to this particular SQLite database.
engine = create_engine(DATABASE_URL)


class Base(DeclarativeBase):
    """Collect the table definitions used by this exercise."""


class Asset(Base):
    """Map Python equipment objects to rows in the assets table."""

    __tablename__ = "assets"

    # SQLite generates an integer ID when a new record is inserted.
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(nullable=False)
    category: Mapped[str] = mapped_column(nullable=False)
    status: Mapped[str] = mapped_column(nullable=False)


def main() -> None:
    # Adding equipment is explicit; the default action only lists records.
    parser = argparse.ArgumentParser(description="Practice equipment storage.")
    parser.add_argument(
        "--add",
        action="store_true",
        help="Save one fictional laptop before listing records.",
    )
    args = parser.parse_args()

    # Create missing tables without deleting existing records.
    Base.metadata.create_all(engine)
    print(f"Database: {DATABASE_PATH}")

    if args.add:
        # This creates a Python object; it has not been saved yet.
        laptop = Asset(
            name="Demo laptop",
            category="laptop",
            status="available",
        )

        # Save the object as a database row in one transaction.
        with Session(engine) as session:
            session.add(laptop)
            session.commit()
            print(f"Saved asset ID: {laptop.id}")

    # A separate session reads records back from the database.
    with Session(engine) as session:
        statement = select(Asset).order_by(Asset.id)
        assets = session.scalars(statement).all()

        print(f"Stored assets: {len(assets)}")
        for asset in assets:
            print(
                f"{asset.id} | {asset.name} | "
                f"{asset.category} | {asset.status}"
            )


# Run the exercise only when this file is executed directly.
if __name__ == "__main__":
    main()
