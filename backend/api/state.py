import asyncio
import logging
from typing import Set, Optional
from core.interfaces import CSISource
from core.types import SensingFrame
from simulator.csi_generator import CSISimulator
from simulator.recorder import SessionRecorder
from simulator.replay import ReplaySource
from .engine import SensingEngine
import config as config

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
        
        # New state fields
        self._current_source: CSISource = CSISimulator()
        self._recording: Optional[SessionRecorder] = None
        self._replay: Optional[ReplaySource] = None
        
        # Auto-record if in live mode
        if config.AUTO_RECORD and isinstance(self._current_source, CSISimulator):
            self._recording = SessionRecorder(self._current_source, config.RECORDINGS_DIR, label="live")
            self.source = self._recording
        else:
            self.source = self._current_source
            
        self.engine: SensingEngine = SensingEngine(self.source)
        self.latest_frame: Optional[SensingFrame] = None
        
        # Hot-swap mechanism
        self._source_lock = asyncio.Lock()
        self._switch_event = asyncio.Event()
        
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
                # Reset switch event at the start of each source lifecycle
                self._switch_event.clear()
                
                # Iterate the current engine
                # We need to wrap the iteration to allow for interruption
                try:
                    async for frame in self.engine.start():
                        # Check if we should switch sources
                        if self._switch_event.is_set():
                            logger.info("Switch event detected, exiting current source loop.")
                            break
                            
                        self.latest_frame = frame
                        
                        # Fan out to subscribers
                        to_remove = []
                        for q in self.subscribers:
                            try:
                                if q.full():
                                    q.get_nowait() # Drop oldest if full
                                q.put_nowait(frame)
                            except Exception as e:
                                logger.error(f"Error putting to subscriber queue: {e}")
                                to_remove.append(q)
                                
                        for q in to_remove:
                            self.unsubscribe(q)
                except Exception as e:
                    logger.error(f"Error in engine iteration: {e}", exc_info=True)
                    
                # If we broke out due to a switch, continue the outer loop to pick up new source
                if self._switch_event.is_set():
                    # Wait briefly for cleanup
                    await asyncio.sleep(0.1)
                    continue
                else:
                    # If the source naturally ended (e.g. replay finished)
                    logger.info("Current source stream ended naturally.")
                    # Return to live mode automatically or wait?
                    # For now, just wait a bit and continue (might loop same source if not changed)
                    await asyncio.sleep(1.0)

        except asyncio.CancelledError:
            logger.info("Sensing loop cancelled.")
            await self.source.close()
        except Exception as e:
            logger.error(f"Critical error in sensing loop: {e}", exc_info=True)

    async def switch_source(self, new_source: CSISource):
        """Hot-swap the CSI source while the loop is running."""
        async with self._source_lock:
            logger.info(f"Switching source to {new_source.__class__.__name__}")
            
            # Stop current source cleanly
            await self.source.close()
            
            # Prepare new source
            self._current_source = new_source
            
            if isinstance(new_source, ReplaySource):
                self._replay = new_source
                self._recording = None # No recording during replay
                self.source = self._replay
            elif isinstance(new_source, CSISimulator):
                self._replay = None
                if config.AUTO_RECORD:
                    self._recording = SessionRecorder(new_source, config.RECORDINGS_DIR, label="live")
                    self.source = self._recording
                else:
                    self._recording = None
                    self.source = new_source
            else:
                self._replay = None
                self._recording = None
                self.source = new_source

            # Update engine
            self.engine = SensingEngine(self.source)
            
            # Signal the run_loop to break out and restart
            self._switch_event.set()

    def get_status(self) -> dict:
        """Return current source info for the /api/status endpoint."""
        return {
            "mode": "replay" if self._replay else "live",
            "filename": self._replay.filename if self._replay else None,
            "progress": round(self._replay.progress, 2) if self._replay else None,
            "recording": self._recording.current_filename if self._recording else None,
        }

    def subscribe(self) -> asyncio.Queue[SensingFrame]:
        """Get a new queue to receive sensing frames."""
        q = asyncio.Queue(maxsize=10) # 10 frames of buffer
        self.subscribers.add(q)
        return q

    def unsubscribe(self, q: asyncio.Queue):
        """Stop sending frames to the given queue."""
        if q in self.subscribers:
            self.subscribers.remove(q)

    async def stop(self):
        """Full shutdown."""
        if self._loop_task:
            self._loop_task.cancel()
            try:
                await self._loop_task
            except asyncio.CancelledError:
                pass
        await self.source.close()

# Export a singleton instance
sensing_state = SensingState()

