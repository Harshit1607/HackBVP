from core.interfaces import InferenceModel
from core.types import VitalSigns
from sensing_signal.fft_vitals import VitalSignsExtractor

class VitalsModel(InferenceModel):
    """Thin wrapper around VitalSignsExtractor providing the InferenceModel interface."""
    def __init__(self, fps: int = 20, window_sec: int = 30):
        self._extractor = VitalSignsExtractor(fps=fps, window_sec=window_sec)

    def push(self, amplitudes):
        """Append mean amplitude sample to extractor buffer."""
        # extractor expects mean amplitude across subcarriers
        mean_amp = float(amplitudes) if isinstance(amplitudes, (float, int)) else float(np.mean(amplitudes))
        self._extractor.push(mean_amp)

    def predict(self, features: dict = None) -> dict:
        """Returns the latest extracted vitals as a dataclass."""
        br, hr = self._extractor.extract()
        br_conf = self._extractor.breathing_confidence()
        hr_conf = self._extractor.hr_confidence()
        
        return {
            "vitals": VitalSigns(
                breathing_bpm=br,
                heart_rate_bpm=hr,
                breathing_confidence=br_conf,
                hr_confidence=hr_conf,
            )
        }
