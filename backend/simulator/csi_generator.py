import asyncio
import time
import numpy as np
from typing import AsyncGenerator
from core.interfaces import CSISource
from core.types import CSIFrame
import config as config

class CSISimulator(CSISource):
    """Produces physically plausible CSI frames with vitals modulation."""
    def __init__(
        self,
        fps: int = config.FPS,
        n_subcarriers: int = config.N_SUBCARRIERS,
        breathing_bpm: float = config.DEFAULT_BREATHING_BPM,
        heart_rate_bpm: float = config.DEFAULT_HEART_RATE_BPM,
        noise_std: float = config.DEFAULT_NOISE_STD,
        rssi: float = -55.0,
        channel: int = 6
    ):
        self.fps = fps
        self.n_subcarriers = n_subcarriers
        self.breathing_bpm = breathing_bpm
        self.heart_rate_bpm = heart_rate_bpm
        self.noise_std = noise_std
        self.rssi = rssi
        self.channel = channel
        self._running = False

    async def stream(self) -> AsyncGenerator[CSIFrame, None]:
        self._running = True
        frame_idx = 0
        
        # Physical model constants
        # Fresnel zone-style sensitivity envelope (Gaussian across subcarriers)
        center_sc = self.n_subcarriers // 2
        sc_sigma = self.n_subcarriers / 4
        subcarriers = np.arange(self.n_subcarriers)
        sensitivity_envelope = np.exp(-0.5 * ((subcarriers - center_sc) / sc_sigma)**2)
        
        interval = 1.0 / self.fps
        
        while self._running:
            start_time = time.time()
            t = start_time
            
            # 1. Breathing component (0.1–0.5 Hz range)
            # Amplitude modulation: A(t) = A0 * (1 + b * sin(2*pi*f_b*t))
            f_breathing = self.breathing_bpm / 60.0
            breathing_signal = 0.1 * np.sin(2 * np.pi * f_breathing * t)
            
            # 2. Heart rate component (0.8–2.0 Hz range)
            f_heart = self.heart_rate_bpm / 60.0
            heart_signal = 0.02 * np.sin(2 * np.pi * f_heart * t)
            
            # Combine signals (modulated by sensitivity across subcarriers)
            # Base amplitude centered around 1.0
            # Broadcast scalar signal to all subcarriers, then multiply by envelope
            vitals_signal = (breathing_signal + heart_signal) * sensitivity_envelope
            base_amplitudes = np.ones(self.n_subcarriers) + vitals_signal
            
            # Add Gaussian noise
            noise = np.random.normal(0, self.noise_std, self.n_subcarriers)
            amplitudes = (base_amplitudes + noise).astype(np.float32)
            
            # Dummy phases (random but consistent for this phase)
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
            
            frame_idx += 1
            # Maintain FPS timing
            elapsed = time.time() - start_time
            sleep_time = max(0, interval - elapsed)
            await asyncio.sleep(sleep_time)

    async def close(self):
        self._running = False




