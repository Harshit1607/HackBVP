import asyncio
import json
import logging
from dataclasses import asdict
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from state import sensing_state

logger = logging.getLogger(__name__)
router = APIRouter()

def sensing_frame_to_dict(frame):
    """Converts a SensingFrame dataclass into a JSON-compatible dict."""
    d = asdict(frame)
    # Ensure nested objects (vitals, presence) are also standard dicts
    # asdict does this recursively, but we still need to check for numpy types
    # or other non-serializable elements if they ever slip in.
    # The amplitudes are already converted to lists in SensingEngine.
    return d

@router.websocket("/ws/sensing")
async def websocket_endpoint(websocket: WebSocket):
    """Broadcasting endpoint for live WiFi sensing frames at ~20 Hz."""
    await websocket.accept()
    logger.info(f"WebSocket client connected: {websocket.client}")
    
    # Subscribe to get a queue of frames from the global sensing state
    queue = sensing_state.subscribe()
    
    try:
        while True:
            # Wait for next frame from the sensing engine
            frame = await queue.get()
            # Send as JSON to client
            await websocket.send_json(sensing_frame_to_dict(frame))
    except WebSocketDisconnect:
        logger.info(f"WebSocket client disconnected: {websocket.client}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}", exc_info=True)
    finally:
        # Ensure we unsubscribe cleanly
        sensing_state.unsubscribe(queue)
        logger.debug(f"Sensing queue unsubscribed for client {websocket.client}")




