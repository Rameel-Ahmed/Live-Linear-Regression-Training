"""Application entrypoint for the Linear Regression API.

Configures CORS, static files, routes, and basic application logging.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from routes.user_routes import user_router
from routes.auth_routes import auth_router
from fastapi.responses import HTMLResponse
from fastapi import HTTPException
import logging

# Basic console logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Linear Regression API", version="1.0.0")

# Static files (for index.html)
app.mount("/static", StaticFiles(directory="static"), name="static")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", response_class=HTMLResponse)
async def root() -> HTMLResponse:
    """Serve the login page."""
    try:
        logger.info("Serving static/login.html")
        with open("static/login.html", "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Login page not found")

@app.get("/app", response_class=HTMLResponse)
async def app_page() -> HTMLResponse:
    """Serve the main application page."""
    try:
        logger.info("Serving static/index.html")
        with open("static/index.html", "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Main page not found")

@app.get("/guest", response_class=HTMLResponse)
async def guest_page() -> HTMLResponse:
    """Serve the guest application page."""
    try:
        logger.info("Serving static/index.html for guest")
        with open("static/index.html", "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Main page not found")


# Register all routes from the controller
app.include_router(user_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1/auth")

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
