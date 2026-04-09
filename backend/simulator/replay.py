import os
import json
import asyncio
import numpy as np
from typing import AsyncGenerator, List
from core.interfaces import CSISource
from core.types import CSIFrame

class ReplaySource(CSISource):
    """Implements CSISource by reading a saved .jsonl session and replaying it."""
    
    def __init__(self, filepath: str, speed: float = 1.0):
        self._filepath = filepath
        self.speed = speed
        
        # Validate existence
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Replay file not found: {filepath}")
            
        self._filename = os.path.basename(filepath)
        self._frames: List[dict] = []
        self._frames_yielded = 0
        
        # Read all lines into memory
        with open(filepath, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip():
                    self._frames.append(json.loads(line))
                    
        self._running = False

    async def stream(self) -> AsyncGenerator[CSIFrame, None]:
        """Yield frames with correct inter-frame timing divided by speed."""
        self._running = True
        self._frames_yielded = 0
        
        # Start at index 0
        for i in range(len(self._frames)):
            if not self._running:
                break
                
            frame_data = self._frames[i]
            
            # Use current frame's timestamp to calculate delay if not the first frame
            if i > 0:
                prev_ts = self._frames[i-1]["timestamp"]
                curr_ts = frame_data["timestamp"]
                delay = (curr_ts - prev_ts) / self.speed
                await asyncio.sleep(max(0, delay))
                
            # Create CSIFrame object from dict
            # Source must be "replay" regardless of what is stored in the file
            frame = CSIFrame(
                timestamp=frame_data["timestamp"],
                node_id=frame_data.get("node_id", "replay-0"),
                amplitudes=np.array(frame_data["amplitudes"], dtype=np.float32),
                phases=np.array(frame_data["phases"], dtype=np.float32),
                rssi=frame_data.get("rssi", -55.0),
                channel=frame_data.get("channel", 6),
                source="replay"
            )
            
            yield frame
            self._frames_yielded += 1
            
        self._running = False

    @property
    def progress(self) -> float:
        """Progress from 0.0 to 1.0 based on frames yielded / total frames."""
        total = len(self._frames)
        if total == 0:
            return 1.0
        return self._frames_yielded / total

    @property
    def filename(self) -> str:
        """Basename of the replay file."""
        return self._filename

    async def close(self):
        """Cleanup."""
        self._running = False
