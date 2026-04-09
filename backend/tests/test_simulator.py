import os
import pytest
import asyncio
import numpy as np
import json
from simulator.csi_generator import CSISimulator
from simulator.breathing_model import BreathingModel
from simulator.noise import MultipathNoise
from simulator.recorder import SessionRecorder
from simulator.replay import ReplaySource
from core.types import CSIFrame
import config as config

@pytest.mark.asyncio
async def test_simulator_yields_frames():
    sim = CSISimulator(fps=10, n_subcarriers=56)
    gen = sim.stream()
    frame = await anext(gen)
    assert isinstance(frame, CSIFrame)
    assert len(frame.amplitudes) == 56
    await sim.close()

def test_breathing_model_sample():
    model = BreathingModel(breathing_bpm=15, hr_bpm=60)
    sample = model.sample(0.0)
    assert isinstance(sample, (float, np.float64))

def test_multipath_noise_apply():
    noise = MultipathNoise(noise_std=0.05, n_reflectors=3, seed=42)
    arr = np.ones(56)
    noisy = noise.apply(arr, 0.0)
    assert noisy.shape == arr.shape
    
    # Deterministic check
    noise2 = MultipathNoise(noise_std=0.05, n_reflectors=3, seed=42)
    noisy2 = noise2.apply(arr, 0.0)
    assert np.allclose(noisy, noisy2)

@pytest.mark.asyncio
async def test_recorder_writes_to_disk(tmp_path):
    output_dir = str(tmp_path / "recordings")
    sim = CSISimulator(fps=100)
    recorder = SessionRecorder(sim, output_dir, label="test")
    
    gen = recorder.stream()
    for _ in range(5):
        await anext(gen)
    
    filename = recorder.current_filename
    filepath = os.path.join(output_dir, filename)
    assert os.path.exists(filepath)
    
    with open(filepath, "r") as f:
        lines = f.readlines()
        assert len(lines) >= 5
        # Verify first line
        data = json.loads(lines[0])
        assert "amplitudes" in data
        assert isinstance(data["amplitudes"], list)

    await recorder.close()

def test_replay_source_init_validation():
    with pytest.raises(FileNotFoundError):
        ReplaySource("nonexistent_file.jsonl")

@pytest.mark.asyncio
async def test_replay_source_yields_fixture():
    fixture_path = "tests/fixtures/sample_session.jsonl"
    if not os.path.exists(fixture_path):
        pytest.skip("Fixture not found")
        
    replay = ReplaySource(fixture_path, speed=10.0)
    gen = replay.stream()
    
    count = 0
    async for frame in gen:
        assert frame.source == "replay"
        count += 1
        
    assert count == 10
    assert replay.progress == 1.0

