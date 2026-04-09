import uuid
import time
import numpy as np
from typing import AsyncGenerator, Optional
from core.interfaces import CSISource
from core.types import CSIFrame, SensingFrame, VitalSigns, PresenceResult
from sensing_signal.hampel import hampel_filter
from models.vitals import VitalsModel
from models.presence import PresenceDetector
from models.pose_stub import PoseStub
import config as config

class SensingEngine:
    """Wires together data sources, signal processing, and models to produce sensing frames."""
    def __init__(self, source: CSISource):
        self.source = source
        self.vitals_model = VitalsModel(fps=config.FPS)
        self.presence_detector = PresenceDetector(window_len=config.FPS * 10) # 10s buffer
        self.pose_stub = PoseStub()

    async def start(self) -> AsyncGenerator[SensingFrame, None]:
        """Runs the pipeline and yields final SensingFrames from the current source."""
        async for csi_frame in self.source.stream():
            # 1. Signal Pre-processing (Clean amplitudes)
            # Take the mean of subcarriers for vitals and presence
            mean_amplitude = float(np.mean(csi_frame.amplitudes))
            
            # 2. Vitals Analysis (use wrapper model)
            self.vitals_model.push(mean_amplitude)
            vitals_data = self.vitals_model.predict()
            
            # 3. Presence Analysis
            # Use per-frame amplitude variance as an indicator
            amp_std = float(np.std(csi_frame.amplitudes))
            self.presence_detector.push(amp_std)
            presence = self.presence_detector.predict()
            
            # 4. Pose Inference (Placeholder)
            pose_data = self.pose_stub.predict({})
            
            # 5. Downsample amplitudes for frontend display (Every 4th subcarrier)
            raw_amplitude = csi_frame.amplitudes[::4].tolist()
            
            # Produce final sensing frame
            yield SensingFrame(
                frame_id=str(uuid.uuid4()),
                timestamp=csi_frame.timestamp,
                source=csi_frame.source,
                vitals=vitals_data["vitals"],
                presence=presence,
                raw_amplitude=raw_amplitude,
                pose_keypoints=pose_data.get("keypoints")
            )

    async def close(self):
        """Shutdown."""
        await self.source.close()

