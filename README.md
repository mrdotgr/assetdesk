# AssetDesk

A small IT equipment-register API built with Python, FastAPI, SQLAlchemy
and SQLite.

Equipment records include an alias, category, brand, optional serial number
and availability status. Each saved record receives an ID and a creation
timestamp.

## Running the project

Developed with Python 3.14 on Ubuntu. Run the following commands in a terminal.

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

Start the development server:

```bash
python -m uvicorn app.main:app --reload
```

Open the [interactive API documentation](http://127.0.0.1:8000/docs) to try
the endpoints. Stop the server with `Ctrl+C`.

## API

| Method | Path | Description |
| --- | --- | --- |
| GET | `/health` | Check that the API responds. |
| POST | `/assets` | Create an equipment record. |

Example request body for `POST /assets`:

```json
{
  "name_alias": "Reception laptop",
  "category": "laptop",
  "brand": "Lenovo",
  "serial_number": "DEMO-SN-001",
  "status": "available"
}
```

A successful request returns `201 Created` with the saved details, including
`id` and `created_at`.

Alias, category and brand are required and cannot be blank. The serial
number can be omitted; supplied serial numbers must be nonblank and unique.
Status accepts `available` or `assigned` and defaults to `available`.

Invalid input returns `422`. A duplicate serial number returns `409`.

## Database

The application creates `assetdesk.db` in the project root and creates
missing tables at startup. Records remain in the file between runs.
Creation timestamps use the `Europe/Athens` timezone and include the UTC offset.

Database files are local and excluded from Git. The examples in `learning/`
use separate databases.

## Tests

With the virtual environment active, run:

```bash
python -m pytest -v
```

The current tests cover input validation: required text, surrounding spaces,
optional serial numbers, allowed statuses and unexpected fields.

## Learning notes

The `learning/` folder contains standalone Python and database exercises:

```bash
python learning/class_basics.py
python learning/table_basics.py
```

The database exercise asks whether to save a demo laptop, then lists its
stored records.

[Python foundations](docs/python-foundations.md) explains the exercises,
the application files and how an asset is validated and saved.

All sample equipment data is fictional.
