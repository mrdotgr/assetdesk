"""AssetDesk API entry point."""

from fastapi import FastAPI


# Create the application object.
app = FastAPI(title="AssetDesk API")


# Handle GET requests sent to /health.
@app.get("/health")
def health():
    # Return information that FastAPI sends as JSON.
    return {
        "status": "ok",
        "application": "AssetDesk",
    }
