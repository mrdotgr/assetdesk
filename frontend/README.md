# AssetDesk frontend

A React interface for viewing equipment and adding new records through
the AssetDesk API. Styling uses ordinary CSS, and Vite runs the development
server and builds the frontend files.

## Running

Use Node.js 24 with npm. From this `frontend/` folder, install the packages
for the first setup:

```bash
npm ci
```

Start the interface:

```bash
npm run dev
```

Open [AssetDesk](http://127.0.0.1:5173). Keep the Python backend running
separately on port 8000. See the [main README](../README.md) for its setup
and startup commands.

Stop the frontend with `Ctrl+C`. Later runs need only `npm run dev`, unless
the dependencies have changed.

## API connection

The interface sends requests to `/api/assets`. During development,
`vite.config.js` forwards them to `http://127.0.0.1:8000/assets`.

GET loads the equipment list. POST submits the form. The backend validates
the data and saves it in SQLite; the browser does not open the database file.

## Main files

| File | Purpose |
| --- | --- |
| `src/App.jsx` | Equipment list, counts, form and API requests |
| `src/App.css` | Layout and component styles |
| `src/index.css` | Shared colours, fonts and page styles |
| `src/main.jsx` | Starts React inside the HTML page |
| `index.html` | Page entry point, title and icon reference |
| `vite.config.js` | Development server and API forwarding |

## Checks

```bash
npm run lint
npm run build
```

The build is written to `dist/`. It does not start the backend or publish
a website. `node_modules/` and `dist/` are excluded from Git; dependency
definitions in `package.json` and `package-lock.json` are committed.

See the [frontend guide](../docs/frontend-guide.md) for explanations of
components, form values and requests.
