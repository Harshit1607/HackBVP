import os
import logging
import asyncio
from datetime import datetime
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Query, Response
from .state import sensing_state
from simulator.csi_generator import CSISimulator
from simulator.replay import ReplaySource
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
        raise HTTPException(status_code=503, detail="Sensing engine warming up...")
    
    from dataclasses import asdict
    return asdict(frame)

@router.get("/status")
async def get_status():
    """Returns the current sensing model status, recording info, and replay progress."""
    return sensing_state.get_status()

@router.get("/sessions")
async def list_sessions() -> List[Dict[str, Any]]:
    """List all saved .jsonl sessions with metadata, newest first."""
    if not os.path.exists(config.RECORDINGS_DIR):
        return []
    
    sessions = []
    for f in os.listdir(config.RECORDINGS_DIR):
        if f.endswith(".jsonl"):
            filepath = os.path.join(config.RECORDINGS_DIR, f)
            stats = os.stat(filepath)
            
            # Extract creation date from unix timestamp if possible
            # Filenames are expected to start with timestamp_label.jsonl
            created_at = None
            try:
                ts_part = f.split('_')[0].split('.')[0]
                ts = int(ts_part)
                created_at = datetime.fromtimestamp(ts).isoformat()
            except (ValueError, IndexError):
                created_at = datetime.fromtimestamp(stats.st_ctime).isoformat()
                
            sessions.append({
                "filename": f,
                "size_kb": round(stats.st_size / 1024, 1),
                "created_at": created_at
            })
    
    # Sort descending by filename prefix (unix timestamp)
    sessions.sort(key=lambda x: x["filename"], reverse=True)
    return sessions

@router.post("/sessions/{filename:path}/play")
async def play_session(filename: str, speed: float = Query(1.0)):
    """Switch the sensing stream to play from a recorded file at controllable speed."""
    
    # Validate speed range
    if not (config.REPLAY_SPEED_MIN <= speed <= config.REPLAY_SPEED_MAX):
        raise HTTPException(
            status_code=422, 
            detail=f"Speed must be between {config.REPLAY_SPEED_MIN} and {config.REPLAY_SPEED_MAX}"
        )
        
    # Prevent path traversal
    if ".." in filename or filename.startswith("/") or filename.startswith("."):
        raise HTTPException(status_code=400, detail="Invalid session filename")
        
    filepath = os.path.join(config.RECORDINGS_DIR, filename)
    
    # Validate existence
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail=f"Session file '{filename}' not found")
        
    try:
        replay_source = ReplaySource(filepath, speed=speed)
        await sensing_state.switch_source(replay_source)
        return {
            "status": "playing", 
            "filename": filename, 
            "speed": speed
        }
    except Exception as e:
        logger.error(f"Failed to start replay: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal error starting replay")

@router.post("/sessions/stop")
async def stop_session():
    """Stop the current replay source and switch back to live simulation."""
    # Re-initialize the live simulator source with current defaults
    simulator = CSISimulator()
    await sensing_state.switch_source(simulator)
    return {"status": "live"}

