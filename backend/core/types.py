from dataclasses import dataclass, field
from typing import Optional
import numpy as np

@dataclass
class CSIFrame:
    """Raw WiFi Channel State Information frame."""
    timestamp: float          # Unix epoch seconds
    node_id: str              # "sim-0", "esp32-0", "replay-0"
    amplitudes: np.ndarray    # shape (n_subcarriers,), dtype float32
    phases: np.ndarray        # shape (n_subcarriers,), dtype float32
    rssi: float               # dBm, e.g. -55.0
    channel: int              # WiFi channel, e.g. 6
    source: str               # "simulator" | "esp32" | "replay"

@dataclass
class VitalSigns:
    """Extracted physiological stats."""
    breathing_bpm: Optional[float]
    heart_rate_bpm: Optional[float]
    breathing_confidence: float    # 0.0–1.0
    hr_confidence: float           # 0.0–1.0

@dataclass
class PresenceResult:
    """Status of person detection."""
    occupied: bool
    person_count: int
    confidence: float              # 0.0–1.0

@dataclass
class SensingFrame:
    """Final output object broadcast to the frontend."""
    frame_id: str
    timestamp: float
    source: str
    vitals: VitalSigns
    presence: PresenceResult
    raw_amplitude: list[float]
    pose_keypoints: Optional[list[dict]] = None




