import numpy as np
from scipy import signal
from typing import Tuple, Optional

class VitalSignsExtractor:
    """Extracts breathing and heart rate from CSI amplitude time series."""
    def __init__(self, fps: int = 20, window_len: int = 600, min_len: int = 200):
        self.fps = fps
        self.window_len = window_len
        self.min_len = min_len
        self.buffer = np.array([], dtype=np.float32)

    def push(self, mean_amplitude: float):
        """Append a sample to the rolling buffer."""
        self.buffer = np.append(self.buffer, mean_amplitude)
        if len(self.buffer) > self.window_len:
            self.buffer = self.buffer[-self.window_len:]

    def extract(self) -> Tuple[Optional[float], Optional[float], float, float]:
        """Run FFT to find dominant peaks in vitals bands."""
        n = len(self.buffer)
        if n < self.min_len:
            return None, None, 0.0, 0.0
        data = self.buffer - np.mean(self.buffer)
        win = signal.windows.hamming(n)
        data = data * win
        freqs = np.fft.rfftfreq(n, d=1.0 / self.fps)
        mags = np.abs(np.fft.rfft(data))
        breathing_band = (0.1, 0.5)
        heart_band = (0.8, 2.0)
        def find_peak(band: Tuple[float, float]) -> Tuple[Optional[float], float]:
            mask = (freqs >= band[0]) & (freqs <= band[1])
            if not np.any(mask): return None, 0.0
            band_mags = mags[mask]
            band_freqs = freqs[mask]
            peak_idx = np.argmax(band_mags)
            peak_freq = band_freqs[peak_idx]
            peak_mag = band_mags[peak_idx]
            mean_band_mag = np.mean(band_mags)
            confidence = (peak_mag / mean_band_mag) if mean_band_mag > 0 else 0.0
            confidence = np.clip((confidence - 1.0) / 4.0, 0, 1)
            return round(float(peak_freq * 60), 1), float(confidence)
        breath_bpm, breath_conf = find_peak(breathing_band)
        hr_bpm, hr_conf = find_peak(heart_band)
        return breath_bpm, hr_bpm, breath_conf, hr_conf


