import uuid
import time
import numpy as np
from typing import AsyncGenerator, Optional
from core.interfaces import CSISource
from core.types import CSIFrame, SensingFrame, VitalSigns, PresenceResult
from sensing_signal.fft_vitals import VitalSignsExtractor
from sensing_signal.hampel import hampel_filter
from models.presence import PresenceDetector
from models.pose_stub import PoseStub
import config as config

class SensingEngine:
    """Wires together data sources, signal processing, and models to produce sensing frames."""
    def __init__(self, source: CSISource):
        self.source = source
        self.vitals_extractor = VitalSignsExtractor(fps=config.FPS)
        self.presence_detector = PresenceDetector(window_len=config.FPS * 10) # 10s buffer
        self.pose_stub = PoseStub()

    async def start(self) -> AsyncGenerator[SensingFrame, None]:
        """Runs the pipeline and yields final SensingFrames."""
        async for csi_frame in self.source.stream():
            # 1. Signal Pre-processing (Clean amplitudes)
            # Use Hampel on the subcarrier mean if we have enough samples, 
            # but for real-time we process each frame individually
            # So for now, we just take the mean of subcarriers for vitals and presence
            mean_amplitude = float(np.mean(csi_frame.amplitudes))
            
            # 2. Vitals Analysis
            self.vitals_extractor.push(mean_amplitude)
            breath_bpm, hr_bpm, breath_conf, hr_conf = self.vitals_extractor.extract()
            vitals = VitalSigns(
                breathing_bpm=breath_bpm,
                heart_rate_bpm=hr_bpm,
                breathing_confidence=breath_conf,
                hr_confidence=hr_conf
            )
            
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
                vitals=vitals,
                presence=presence,
                raw_amplitude=raw_amplitude,
                pose_keypoints=pose_data["keypoints"]
            )




