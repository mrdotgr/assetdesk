# AssetDesk

An IT equipment register for tracking device names, categories and
availability.

Built with Python and FastAPI, with SQLAlchemy and SQLite for database
storage exercises. The API currently provides a health endpoint;
equipment creation and listing are the next steps.

## Getting started

Development environment: Python 3.14 on Ubuntu.

Clone the repository:

```bash
git clone https://github.com/mrdotgr/assetdesk-api.git
cd assetdesk-api
```

Create a virtual environment and install the dependencies:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```
## Running the API

From the project root, with the virtual environment activated:

```bash
python -m uvicorn app.main:app --reload
```

- Health check: http://127.0.0.1:8000/health
- Interactive documentation: http://127.0.0.1:8000/docs

Stop the development server with `Ctrl+C`.

## Running the examples

The `learning/` directory contains standalone examples used during
development.

### Equipment objects

```bash
python learning/class_basics.py
```

Creates equipment objects and demonstrates reading and changing their
attributes.

### Database storage

```bash
python learning/table_basics.py
```

Creates a local SQLite database and an `assets` table if they do not exist.

When prompted, enter `yes` to save a fictional laptop or `no` to list
existing records without adding one. Each `yes` adds a separate record.
The script then displays the saved equipment and its count.

Records are stored in `learning/table_basics.db` and remain available
between runs. Generated database files are excluded from version control.

## Development notes

[Python foundations](docs/python-foundations.md) covers the concepts used
in the examples.

All sample equipment data is fictional.

## Tests

Run the test suite from the project root:

```bash
python -m pytest -v
```

The schema tests cover required text fields, whitespace handling, optional
serial numbers, status values and unexpected input fields.
