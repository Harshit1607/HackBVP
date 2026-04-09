import asyncio
import time
import numpy as np
from typing import AsyncGenerator
from core.interfaces import CSISource
from core.types import CSIFrame
import config as config
from simulator.breathing_model import BreathingModel
from simulator.noise import MultipathNoise

class CSISimulator(CSISource):
    """Produces physically plausible CSI frames with vitals modulation."""
    def __init__(
        self,
        fps: int = config.FPS,
        n_subcarriers: int = config.N_SUBCARRIERS,
        breathing_bpm: float = config.BREATHING_BPM,
        heart_rate_bpm: float = config.HEART_RATE_BPM,
        noise_std: float = config.NOISE_STD,
        rssi: float = -55.0,
        channel: int = 6
    ):
        self.fps = fps
        self.n_subcarriers = n_subcarriers
        self.rssi = rssi
        self.channel = channel
        self._running = False
        
        # Extracted models
        self.breathing_model = BreathingModel(
            breathing_bpm=breathing_bpm,
            hr_bpm=heart_rate_bpm
        )
        self.noise_model = MultipathNoise(
            noise_std=noise_std
        )

    async def stream(self) -> AsyncGenerator[CSIFrame, None]:
        self._running = True
        
        # Physical model constants
        # Fresnel zone-style sensitivity envelope (Gaussian across subcarriers)
        center_sc = self.n_subcarriers // 2
        sc_sigma = self.n_subcarriers / 4
        subcarriers = np.arange(self.n_subcarriers)
        sensitivity_envelope = np.exp(-0.5 * ((subcarriers - center_sc) / sc_sigma)**2)
        
        interval = 1.0 / self.fps
        
        while self._running:
            t = time.time()
            
            # 1. Generate composite vitals signal
            vitals_amp = self.breathing_model.sample(t)
            
            # 2. Combine signals (modulated by sensitivity across subcarriers)
            # Base amplitude centered around 1.0
            vitals_signal = vitals_amp * sensitivity_envelope
            base_amplitudes = np.ones(self.n_subcarriers, dtype=np.float32) + vitals_signal
            
            # 3. Add multipath drift and white noise
            amplitudes = self.noise_model.apply(base_amplitudes, t).astype(np.float32)
            
            # 4. Dummy phases (uniform random)
            phases = np.random.uniform(-np.pi, np.pi, self.n_subcarriers).astype(np.float32)
            
            yield CSIFrame(
                timestamp=t,
                node_id="sim-0",
                amplitudes=amplitudes,
                phases=phases,
                rssi=self.rssi,
                channel=self.channel,
                source="simulator"
            )
            
            # Maintain FPS timing
            elapsed = time.time() - t
            sleep_time = max(0, interval - elapsed)
            await asyncio.sleep(sleep_time)

    async def close(self):
        self._running = False
