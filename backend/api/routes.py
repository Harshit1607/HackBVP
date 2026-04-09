import os
import logging
import asyncio
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Query, Response
from state import sensing_state
from simulator.csi_generator import CSISimulator
import config as config

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/health")
async def health_check():
    """Simple health check endpoint."""
    has_data = sensing_state.latest_frame is not None
    return {"status": "ok", "has_data": has_data}

@router.get("/sensing/latest")
async def get_latest_frame():
    """Retrieve the single most recent sensing frame from the global state."""
    frame = sensing_state.latest_frame
    if frame is None:
        # Before any frames have been processed, we shouldn't serve stale results
        raise HTTPException(status_code=503, detail="Sensing engine warming up...")
    
    # Return as a dataclass-converted dict
    from dataclasses import asdict
    return asdict(frame)

@router.get("/sessions")
async def list_sessions() -> List[Dict[str, Any]]:
    """List all saved .jsonl WiFi sensing sessions in the recording directory."""
    if not os.path.exists(config.RECORDINGS_DIR):
        return []
    
    sessions = []
    for filename in os.listdir(config.RECORDINGS_DIR):
        if filename.endswith(".jsonl"):
            filepath = os.path.join(config.RECORDINGS_DIR, filename)
            stats = os.stat(filepath)
            sessions.append({
                "filename": filename,
                "size_kb": round(stats.st_size / 1024, 1)
            })
    
    # Sort descending by filename (assuming Unix timestamp prefix)
    sessions.sort(key=lambda x: x["filename"], reverse=True)
    return sessions

@router.post("/sessions/{filename}/play")
async def play_session(filename: str, speed: float = Query(1.0, ge=0.5, le=4.0)):
    """Switch the live sensing engine to replay data from a recorded file."""
    # Placeholder: ReplaySource to be implemented in Week 2
    # For Week 1, we return 404/501 as it's not ready yet
    raise HTTPException(status_code=501, detail="ReplaySource not implemented in Week 1")

@router.post("/sessions/stop")
async def stop_session():
    """Stop the current replay source and switch back to the live CSISimulator."""
    # Re-initialize the live simulator source
    simulator = CSISimulator()
    await sensing_state.switch_source(simulator)
    return {"status": "live"}




