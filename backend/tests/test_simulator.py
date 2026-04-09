import pytest
import asyncio
import numpy as np
from simulator.csi_generator import CSISimulator
from core.types import CSIFrame

@pytest.mark.asyncio
async def test_simulator_yields_frames():
    """Verify that CSISimulator emits frames with correct attributes."""
    sim = CSISimulator(fps=10, n_subcarriers=56)
    gen = sim.stream()
    
    frame = await anext(gen)
    assert isinstance(frame, CSIFrame)
    assert frame.amplitudes.shape == (56,)
    assert frame.source == "simulator"
    assert frame.timestamp > 0
    
    await sim.close()

@pytest.mark.asyncio
async def test_simulator_signal_varies():
    """Verify that simulated signals are not constant (includes noise and vitals)."""
    sim = CSISimulator(fps=20, n_subcarriers=56)
    gen = sim.stream()
    
    f1 = await anext(gen)
    f2 = await anext(gen)
    
    assert not np.array_equal(f1.amplitudes, f2.amplitudes)
    await sim.close()

@pytest.mark.asyncio
async def test_simulator_fps_timing():
    """Verify that the simulator respects the target FPS."""
    fps = 20
    sim = CSISimulator(fps=fps, n_subcarriers=56)
    gen = sim.stream()
    
    timestamps = []
    # Collect 11 frames to get 10 intervals
    for _ in range(11):
        frame = await anext(gen)
        timestamps.append(frame.timestamp)
        
    deltas = np.diff(timestamps)
    mean_interval = np.mean(deltas)
    
    # Check within 10% tolerance (0.05s for 20 FPS)
    expected_interval = 1.0 / fps
    assert mean_interval == pytest.approx(expected_interval, rel=0.1)
    
    await sim.close()




