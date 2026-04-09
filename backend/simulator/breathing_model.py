import numpy as np

class BreathingModel:
    """Generates a composite breathing + heart rate signal over time."""

    def __init__(self, breathing_bpm: float = 15.0, hr_bpm: float = 68.0,
                 breathing_amplitude: float = 0.3, hr_amplitude: float = 0.08):
        self.breathing_freq = breathing_bpm / 60.0
        self.hr_freq = hr_bpm / 60.0
        self.breathing_amplitude = breathing_amplitude
        self.hr_amplitude = hr_amplitude

    def sample(self, t: float, dist_factor: float = 1.0) -> float:
        """Return the combined vital signal amplitude at time t (seconds)."""
        # Composite sinusoid with breathing and heart rate frequencies
        breathing = self.breathing_amplitude * np.sin(2 * np.pi * self.breathing_freq * t)
        heart_rate = self.hr_amplitude * np.sin(2 * np.pi * self.hr_freq * t)
        
        # Distance inverse-square-ish modulation
        modulation = 1.0 / (dist_factor ** 2)
        return (breathing + heart_rate) * modulation

class MovementModel:
    """Simulates a person walking in a 2D plane."""
    def __init__(self, speed: float = 0.5, bounds: tuple = (-5.0, 5.0)):
        self.speed = speed
        self.bounds = bounds
        self.center = (0.0, 0.0)
        
    def get_pos(self, t: float) -> tuple:
        """Calculate X, Z position at time t."""
        # Simple circular movement for now
        radius = 2.0 + np.sin(t * 0.1) * 1.0
        x = radius * np.cos(t * self.speed)
        z = radius * np.sin(t * self.speed * 1.1)
        return x, z
