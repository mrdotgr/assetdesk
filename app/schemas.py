"""Validation schemas for equipment requests."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class AssetCreate(BaseModel):
    """Information accepted when creating equipment."""

    # Remove surrounding spaces and reject unexpected fields.
    model_config = ConfigDict(
        str_strip_whitespace=True,
        extra="forbid",
    )

    # Require these text fields to contain at least one character.
    name_alias: str = Field(min_length=1)
    category: str = Field(min_length=1)
    brand: str = Field(min_length=1)

    # Missing serial numbers are allowed; blank strings are not.
    serial_number: str | None = Field(default=None, min_length=1)

    # Accept only these two statuses and use available when none is supplied.
    status: Literal["available", "assigned"] = "available"

class AssetRead(BaseModel):
    """Equipment information returned by the API."""

    # Allow reading attributes from a SQLAlchemy object.
    model_config = ConfigDict(from_attributes=True)

    id: int
    name_alias: str
    category: str
    brand: str
    serial_number: str | None
    status: Literal["available", "assigned"]
    created_at: str
