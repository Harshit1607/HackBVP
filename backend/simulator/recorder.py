import os
import json
import time
from typing import AsyncGenerator
import numpy as np
from core.interfaces import CSISource
from core.types import CSIFrame

class SessionRecorder(CSISource):
    """Wraps any CSISource and writes every frame to a .jsonl file."""
    
    def __init__(self, source: CSISource, output_dir: str, label: str = ""):
        self.source = source
        self.output_dir = output_dir
        self.label = label
        
        # Ensure output directory exists
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
            
        # Generate filename: {unix_timestamp}_{label}.jsonl
        ts = int(time.time())
        self._filename = f"{ts}_{label}.jsonl" if label else f"{ts}.jsonl"
        self._filepath = os.path.join(output_dir, self._filename)
        
        self._file = open(self._filepath, "w", encoding="utf-8")

    async def stream(self) -> AsyncGenerator[CSIFrame, None]:
        """Iterate source, write each frame, yield it unchanged."""
        try:
            async for frame in self.source.stream():
                # Convert CSIFrame to dict for serialization
                # Convert numpy arrays to lists
                frame_dict = {
                    "timestamp": frame.timestamp,
                    "node_id": frame.node_id,
                    "amplitudes": frame.amplitudes.tolist() if isinstance(frame.amplitudes, np.ndarray) else frame.amplitudes,
                    "phases": frame.phases.tolist() if isinstance(frame.phases, np.ndarray) else frame.phases,
                    "rssi": frame.rssi,
                    "channel": frame.channel,
                    "source": frame.source
                }
                
                # Write to .jsonl
                self._file.write(json.dumps(frame_dict) + "\n")
                self._file.flush() # Flush after every write
                
                yield frame
        finally:
            await self.close()

    @property
    def current_filename(self) -> str:
        """The filename currently being recorded to."""
        return self._filename

    async def close(self):
        """Close the file handle cleanly."""
        if self._file and not self._file.closed:
            self._file.close()
        await self.source.close()
