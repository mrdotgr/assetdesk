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

    name_alias: str = Field(min_length=1)
    category: str = Field(min_length=1)
    brand: str = Field(min_length=1)

    # Missing serial numbers are allowed; blank strings are not.
    serial_number: str | None = Field(default=None, min_length=1)

    status: Literal["available", "assigned"] = "available"
