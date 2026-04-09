import numpy as np

class MultipathNoise:
    """Simulates multipath interference and environmental noise on CSI."""

    def __init__(self, noise_std: float = 0.05, n_reflectors: int = 3,
                 seed: int | None = None):
        self._rng = np.random.default_rng(seed)
        self.noise_std = noise_std
        
        # Slow multipath drift: 2-3 slow sinusoids (0.01-0.05 Hz)
        self.n_reflectors = n_reflectors
        self.freqs = self._rng.uniform(0.01, 0.05, n_reflectors)
        self.phases = self._rng.uniform(0, 2 * np.pi, n_reflectors)
        self.amps = self._rng.uniform(0.01, 0.05, n_reflectors)

    def apply(self, amplitudes: np.ndarray, t: float) -> np.ndarray:
        """Add noise and slow multipath drift to an amplitude array."""
        # Calculate drift for each reflector and sum them
        drift = np.sum([self.amps[i] * np.sin(2 * np.pi * self.freqs[i] * t + self.phases[i]) 
                        for i in range(self.n_reflectors)])
        
        # Add white Gaussian noise
        noise = self._rng.normal(0, self.noise_std, size=amplitudes.shape)
        
        # Apply additive drift and noise to the original CSI amplitudes
        return amplitudes + drift + noise
