# AssetDesk

An IT equipment-register project for practicing Python backend development.

AssetDesk focuses on organizing equipment records by name, category and
availability.

## Current progress

The project currently contains Python learning exercises:

- Create equipment objects with attributes and methods.
- Define an equipment table using SQLAlchemy.
- Create a local SQLite database and its table.
- Save fictional equipment records using a database session.

The API is not implemented yet.

## Learning goals

- Understand HTTP requests and API responses.
- Validate equipment information.
- Work with relational databases through Python.
- Practice Git version control through incremental development.

## Development environment

- Ubuntu 26.04.1 LTS
- Python 3.14.4

## Python environment setup

Run these commands from the project root:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```

The virtual environment keeps project dependencies separate from other
Python environments.

## Learning exercises

### Python classes

```bash
python learning/class_basics.py
```

Practices creating equipment objects, reading their attributes and changing
their values through methods.

See [Python foundations](docs/python-foundations.md) for explanations and
practice examples.

### Database tables and saving records

```bash
python learning/table_basics.py
```

Creates `learning/table_basics.db` and the `assets` table if they do not
already exist, then saves one fictional laptop record.

Each run adds another record. Existing records remain in the database.

Local database files are excluded from Git.

## Sample data

Examples use fictional equipment records.
