import numpy as np
from core.types import PresenceResult

class PresenceDetector:
    """Detects human presence using variance analysis of amplitude time series."""
    def __init__(self, window_len: int = 100, threshold: float = 0.015):
        self.window_len = window_len
        self.threshold = threshold
        self.buffer = np.array([], dtype=np.float32)

    def push(self, variance: float):
        """Add a per-frame variance sample (std dev) to the rolling buffer."""
        self.buffer = np.append(self.buffer, variance)
        if len(self.buffer) > self.window_len:
            self.buffer = self.buffer[-self.window_len:]

    def predict(self) -> PresenceResult:
        """Determine occupancy based on recent variance compared to threshold."""
        if len(self.buffer) < self.window_len / 2:
            return PresenceResult(occupied=False, person_count=0, confidence=0.0)
            
        recent_variance = np.mean(self.buffer)
        occupied = recent_variance > self.threshold
        
        # Confidence: ratio of recent_variance / (2 * threshold) clamped to 1.0
        confidence = np.clip(recent_variance / (2 * self.threshold), 0, 1.0)
        
        # Simplification: if occupied, person_count is 1
        person_count = 1 if occupied else 0
        
        return PresenceResult(
            occupied=occupied,
            person_count=person_count,
            confidence=float(confidence)
        )




