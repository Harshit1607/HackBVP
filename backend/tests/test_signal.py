import pytest
import numpy as np
from sensing_signal.hampel import hampel_filter
from sensing_signal.fft_vitals import VitalSignsExtractor

def test_hampel_filter_replaces_outlier():
    """Verify that Hampel filter can identify and fix a synthetic outlier."""
    data = np.ones(100)
    data[50] = 100.0  # Clear outlier
    
    filtered = hampel_filter(data, window_size=10, n_sigma=3.0)
    
    assert filtered[50] != 100.0
    assert filtered[50] == pytest.approx(1.0, abs=0.1)

def test_vitals_extractor_buffering():
    """Verify that extractor returns None during warm-up phase (first 10 seconds)."""
    # Use default 30s window_sec, but the extractor needs 10s (fps*10) to return data
    fps = 20
    extractor = VitalSignsExtractor(fps=fps)
    
    # Push 150 samples (7.5 seconds)
    for _ in range(150):
        extractor.push(1.0)
        
    breath, hr = extractor.extract()
    assert breath is None
    assert hr is None
    assert extractor.breathing_confidence() == 0.0
    assert extractor.hr_confidence() == 0.0

def test_vitals_extractor_accuracy():
    """Verify that extractor finds the frequency of a synthetic sine wave."""
    fps = 20
    # Create 30 seconds of data with a 15 BPM breathing signal
    duration = 30
    t = np.linspace(0, duration, fps * duration)
    freq = 15 / 60
    # Add a pure sine wave on top of some base amplitude
    signal = 1.0 + 0.1 * np.sin(2 * np.pi * freq * t)
    
    extractor = VitalSignsExtractor(fps=fps)
    for sample in signal:
        extractor.push(sample)
        
    breath, hr = extractor.extract()
    
    # We expect 15.0 BPM
    assert breath == pytest.approx(15.0, abs=1.0)
    assert extractor.breathing_confidence() > 0.5
