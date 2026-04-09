from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .state import sensing_state
from .routes import router as api_router
from .ws import router as ws_router

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Wait for sensing loop to start before accepting requests."""
    logger.info("Initializing sensing state...")
    try:
        # Initial starting of the sensing loop
        from asyncio import create_task
        task = create_task(sensing_state.start())
        logger.info("WiFi DensePose backend lifespan startup complete.")
        yield
    finally:
        logger.info("Shutting down sensing loop...")
        await sensing_state.stop()
        logger.info("WiFi DensePose backend lifecycle shutdown complete.")

app = FastAPI(
    title="WiFi DensePose API",
    description="Sensing platform backend for WiFi-DensePose / RuView.",
    version="0.1.0",
    lifespan=lifespan
)

# CORS middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include modules
app.include_router(api_router, prefix="/api")
app.include_router(ws_router)

@app.get("/")
async def root():
    return {"message": "WiFi DensePose Backend is running.", "docs": "/docs"}





