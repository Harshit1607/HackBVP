import asyncio
import logging
from typing import Set, Optional
from core.interfaces import CSISource
from core.types import SensingFrame
from simulator.csi_generator import CSISimulator
from engine import SensingEngine

logger = logging.getLogger(__name__)

class SensingState:
    """Global singleton that manages sensing state and WebSocket fans."""
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SensingState, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if getattr(self, "_initialized", False):
            return
        
        # Core active objects
        self.source: CSISource = CSISimulator()
        self.engine: SensingEngine = SensingEngine(self.source)
        self.latest_frame: Optional[SensingFrame] = None
        
        # Fans out to subscribers
        self.subscribers: Set[asyncio.Queue] = set()
        self._loop_task: Optional[asyncio.Task] = None
        self._initialized = True

    async def start(self):
        """Start the background task that consumes SensingFrames."""
        if self._loop_task is None or self._loop_task.done():
            self._loop_task = asyncio.create_task(self._run_loop())
            logger.info("Sensing loop started.")

    async def _run_loop(self):
        """Async generator consumer that fans out to all subscribers."""
        try:
            while True:
                async for frame in self.engine.start():
                    self.latest_frame = frame
                    # Copy subscribers to avoid set mutation during iteration
                    to_remove = []
                    for q in self.subscribers:
                        try:
                            # Drop frame if the queue is full (slow client)
                            if q.full():
                                q.get_nowait() # Remove oldest frame to make space?
                                # Or just skip adding to this client
                                # Let's skip to keep it simple and non-blocking
                                pass
                            else:
                                q.put_nowait(frame)
                        except Exception as e:
                            logger.error(f"Error putting to subscriber queue: {e}")
                            to_remove.append(q)
                            
                    for q in to_remove:
                        self.unsubscribe(q)
        except asyncio.CancelledError:
            logger.info("Sensing loop cancelled.")
            await self.source.close()
        except Exception as e:
            logger.error(f"Critical error in sensing loop: {e}", exc_info=True)

    async def switch_source(self, new_source: CSISource):
        """Hot-swap the CSI source without stopping the loop completely."""
        logger.info(f"Switching source from {self.source.__class__.__name__} to {new_source.__class__.__name__}")
        
        # Stop current source stream
        await self.source.close()
        
        # Replace the engine's source
        self.source = new_source
        self.engine = SensingEngine(self.source)
        
        # If loop was running, restart it with new source
        if self._loop_task:
            self._loop_task.cancel()
            await asyncio.sleep(0.1) # Small pause for cleanup
            self._loop_task = asyncio.create_task(self._run_loop())

    def subscribe(self) -> asyncio.Queue[SensingFrame]:
        """Get a new queue to receive sensing frames."""
        q = asyncio.Queue(maxsize=10) # 10 frames of buffer
        self.subscribers.add(q)
        logger.debug(f"Subscriber added. Current count: {len(self.subscribers)}")
        return q

    def unsubscribe(self, q: asyncio.Queue):
        """Stop sending frames to the given queue."""
        if q in self.subscribers:
            self.subscribers.remove(q)
            logger.debug(f"Subscriber removed. Current count: {len(self.subscribers)}")

    async def stop(self):
        """Full shutdown."""
        if self._loop_task:
            self._loop_task.cancel()
            await self._loop_task
        await self.source.close()

# Export a singleton instance
sensing_state = SensingState()




