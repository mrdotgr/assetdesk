"""AssetDesk API entry point."""

from contextlib import asynccontextmanager
from sqlite3 import SQLITE_CONSTRAINT_UNIQUE

from fastapi import FastAPI, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import Base, engine
from app.models import Asset
from app.schemas import AssetCreate, AssetRead


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Prepare missing tables before serving requests.
    Base.metadata.create_all(engine)
    yield
    # Release database connections when the server stops.
    engine.dispose()


app = FastAPI(title="AssetDesk API", lifespan=lifespan)


@app.get("/health")
def health():
    """Confirm that the API responds."""
    return {
        "status": "ok",
        "application": "AssetDesk",
    }


@app.post("/assets", response_model=AssetRead, status_code=201)
def create_asset(equipment: AssetCreate):
    """Save validated equipment and return its stored details."""

    # Convert validated input into a database object.
    # ID and creation time are generated during insertion.
    asset = Asset(
        name_alias=equipment.name_alias,
        category=equipment.category,
        brand=equipment.brand,
        serial_number=equipment.serial_number,
        status=equipment.status,
    )

    # Keep database work inside a session that closes automatically.
    with Session(engine) as session:
        session.add(asset)

        try:
            session.commit()
        except IntegrityError as error:
            # Reset the session after the failed transaction.
            session.rollback()

            # The serial number is our model's only unique-value constraint.
            if (
                getattr(error.orig, "sqlite_errorcode", None)
                == SQLITE_CONSTRAINT_UNIQUE
            ):
                raise HTTPException(
                    status_code=409,
                    detail="An asset with this serial number already exists.",
                ) from error

            # Preserve other integrity errors for investigation.
            raise

        # Reload saved values, including the generated ID and timestamp.
        session.refresh(asset)

        # Build the response before closing the database session.
        return AssetRead.model_validate(asset)
