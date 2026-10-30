"""AssetDesk API entry point."""

from contextlib import asynccontextmanager
from sqlite3 import SQLITE_CONSTRAINT_UNIQUE

from fastapi import FastAPI, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import Base, engine
from app.models import Asset
from app.schemas import AssetCreate, AssetRead


# Run setup before the API starts and cleanup after it stops.
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Prepare missing tables before serving requests.
    Base.metadata.create_all(engine)
    yield
    # Release database connections when the server stops.
    engine.dispose()


# Create the API application and connect its startup and shutdown handler.
app = FastAPI(title="AssetDesk API", lifespan=lifespan)


# Run the function below when a GET request arrives at /health.
@app.get("/health")
def health():
    """Confirm that the API responds."""
    return {
        "status": "ok",
        "application": "AssetDesk",
    }


# Run the function below when a POST request arrives at /assets.
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
        # Mark the new asset to be inserted when the session is saved.
        session.add(asset)

        # Handle database errors if saving the asset fails.
        try:
            # Save the pending changes to the database.
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

# Run the function below when a GET request arrives at /assets.
@app.get("/assets", response_model=list[AssetRead])
def list_assets():
    """Return saved equipment in ID order."""

    # Open a database session that closes when this block finishes.
    with Session(engine) as session:
        # Describe the query, then retrieve the matching Asset objects.
        statement = select(Asset).order_by(Asset.id)
        assets = session.scalars(statement).all()

        # Build response objects while the database session is open.
        response = []
        for asset in assets:
            response.append(AssetRead.model_validate(asset))

        return response


# Run the function below when a PUT request arrives for one asset ID.
@app.put("/assets/{asset_id}", response_model=AssetRead)
def update_asset(asset_id: int, equipment: AssetCreate):
    """Update existing equipment and return its stored details."""

    # Open a database session that closes when this block finishes.
    with Session(engine) as session:
        # Find the asset by its primary key.
        asset = session.get(Asset, asset_id)

        # Return a not-found response when the asset does not exist.
        if asset is None:
            raise HTTPException(
                status_code=404,
                detail="Asset not found.",
            )

        # Replace the editable fields without changing the ID or creation time.
        asset.name_alias = equipment.name_alias
        asset.category = equipment.category
        asset.brand = equipment.brand
        asset.serial_number = equipment.serial_number
        asset.status = equipment.status

        # Handle database errors if saving the asset fails.
        try:
            # Save the pending changes to the database.
            session.commit()
        except IntegrityError as error:
            # Reset the session after the failed transaction.
            session.rollback()

            # Return a conflict when another asset uses this serial number.
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

        # Reload the saved values from the database.
        session.refresh(asset)

        # Build the response before closing the database session.
        return AssetRead.model_validate(asset)


# Run the function below when a DELETE request arrives for one asset ID.
@app.delete("/assets/{asset_id}", status_code=204, response_class=Response)
def delete_asset(asset_id: int):
    """Delete one saved asset."""

    # Open a database session that closes when this block finishes.
    with Session(engine) as session:
        # Find the asset by its primary key.
        asset = session.get(Asset, asset_id)

        # Return a not-found response when the asset does not exist.
        if asset is None:
            raise HTTPException(
                status_code=404,
                detail="Asset not found.",
            )

        # Delete only this asset and save the change to the database.
        session.delete(asset)
        session.commit()

        # Return an empty response to confirm successful deletion.
        return Response(status_code=204)
