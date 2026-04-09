import logging
from typing import Set
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from .state import sensing_state
from dataclasses import asdict

logger = logging.getLogger(__name__)
router = APIRouter()

def sensing_frame_to_dict(frame):
    """Converts a SensingFrame dataclass into a JSON-compatible dict."""
    return asdict(frame)

class SensingServlet:
    """
    Class-based handler for WiFi sensing data streams.
    Encapsulates the subscription and broadcasting logic for WebSocket clients.
    """
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def handle_stream(self, websocket: WebSocket):
        """Manages the lifecycle of a sensing data stream connection."""
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"SensingServlet: New client attached. Active count: {len(self.active_connections)}")
        
        # Subscribe to global sensing state
        queue = sensing_state.subscribe()
        
        try:
            while True:
                # Get latest frame processed by the engine
                frame = await queue.get()
                # Deliver to client
                await websocket.send_json(sensing_frame_to_dict(frame))
        except WebSocketDisconnect:
            logger.info("SensingServlet: Client detached.")
        except Exception as e:
            logger.error(f"SensingServlet: Error during data delivery: {e}", exc_info=True)
        finally:
            self.active_connections.discard(websocket)
            sensing_state.unsubscribe(queue)

# Instance to be used by the router
sensing_servlet = SensingServlet()

@router.websocket("/ws/sensing")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket entry point that delegates to the SensingServlet."""
    await sensing_servlet.handle_stream(websocket)
