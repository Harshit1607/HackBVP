import numpy as np

class BreathingModel:
    """Generates a composite breathing + heart rate signal over time."""

    def __init__(self, breathing_bpm: float = 15.0, hr_bpm: float = 68.0,
                 breathing_amplitude: float = 0.3, hr_amplitude: float = 0.08):
        self.breathing_freq = breathing_bpm / 60.0
        self.hr_freq = hr_bpm / 60.0
        self.breathing_amplitude = breathing_amplitude
        self.hr_amplitude = hr_amplitude

    def sample(self, t: float) -> float:
        """Return the combined vital signal amplitude at time t (seconds)."""
        # Composite sinusoid with breathing and heart rate frequencies
        breathing = self.breathing_amplitude * np.sin(2 * np.pi * self.breathing_freq * t)
        heart_rate = self.hr_amplitude * np.sin(2 * np.pi * self.hr_freq * t)
        
        # Add slight nonlinearity or harmonic if we want but keeping it simple as requested
        return breathing + heart_rate
