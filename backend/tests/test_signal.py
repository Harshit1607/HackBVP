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
    # 20 FPS * 10 seconds = 200 samples
    extractor = VitalSignsExtractor(fps=20, min_len=200)
    
    # Push 150 samples (7.5 seconds)
    for _ in range(150):
        extractor.push(1.0)
        
    breath, hr, conf_b, conf_hr = extractor.extract()
    assert breath is None
    assert hr is None
    assert conf_b == 0.0
    assert conf_hr == 0.0

def test_vitals_extractor_accuracy():
    """Verify that extractor finds the frequency of a synthetic sine wave."""
    fps = 20
    # Create 30 seconds of data with a 15 BPM breathing signal
    # 15 BPM = 0.25 Hz
    duration = 30
    t = np.linspace(0, duration, fps * duration)
    freq = 15 / 60
    # Add a pure sine wave on top of some base amplitude
    signal = 1.0 + 0.1 * np.sin(2 * np.pi * freq * t)
    
    extractor = VitalSignsExtractor(fps=fps, min_len=200)
    for sample in signal:
        extractor.push(sample)
        
    breath, hr, conf_b, conf_hr = extractor.extract()
    
    # We expect 15.0 BPM
    assert breath == pytest.approx(15.0, abs=1.0)
    assert conf_b > 0.5 # Should be fairly confident in a clean sine wave




