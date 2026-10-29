"""Tests for equipment input validation."""

import pytest
from pydantic import ValidationError

from app.schemas import AssetCreate


def test_valid_asset_trims_alias_and_uses_defaults():
    """Accept valid equipment, trim spaces and apply default values."""
    equipment = AssetCreate(
        name_alias="  Reception laptop  ",
        category="laptop",
        brand="Lenovo",
    )

    # Each assertion checks an expected result.
    assert equipment.name_alias == "Reception laptop"
    assert equipment.serial_number is None
    assert equipment.status == "available"


# Run the same test once for each invalid input listed below.
@pytest.mark.parametrize(
    "changes",
    [
        {"name_alias": "   "},
        {"category": ""},
        {"brand": "   "},
        {"serial_number": "   "},
        {"status": "broken"},
        {"id": 99},
    ],
    ids=[
        "blank-alias",
        "blank-category",
        "blank-brand",
        "blank-serial-number",
        "unsupported-status",
        "user-supplied-id",
    ],
)
def test_invalid_asset_is_rejected(changes):
    """Reject each invalid variation of otherwise valid equipment."""
    data = {
        "name_alias": "Reception laptop",
        "category": "laptop",
        "brand": "Lenovo",
    }
    # Replace part of the valid input with this test case's invalid value.
    data.update(changes)

    # The test passes only if validation rejects this input.
    with pytest.raises(ValidationError):
        AssetCreate(**data)
