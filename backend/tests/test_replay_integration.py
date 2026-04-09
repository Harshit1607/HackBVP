import os
import pytest
import asyncio
import numpy as np
import json
from simulator.csi_generator import CSISimulator
from simulator.recorder import SessionRecorder
from simulator.replay import ReplaySource
from core.types import CSIFrame

@pytest.mark.asyncio
async def test_end_to_end_record_and_replay(tmp_path):
    """Record 3 seconds of simulator, replay at 4x speed, verify frames."""
    output_dir = str(tmp_path / "e2e_recordings")
    sim = CSISimulator(fps=10)
    recorder = SessionRecorder(sim, output_dir, label="e2e")
    
    # Record exactly 30 frames (3 seconds at 10 fps)
    record_gen = recorder.stream()
    recorded_frames = []
    for _ in range(30):
        frame = await anext(record_gen)
        recorded_frames.append(frame)
        
    # Stop recorder
    await recorder.close()
    
    # Replay it with ReplaySource at speed=4.0
    filepath = os.path.join(output_dir, recorder.current_filename)
    replay = ReplaySource(filepath, speed=4.0)
    replay_gen = replay.stream()
    
    replayed_frames = []
    async for frame in replay_gen:
        replayed_frames.append(frame)
        
    # Assert frame count matches recorded count
    assert len(replayed_frames) == len(recorded_frames)
    
    # Assert all frame timestamps are increasing
    timestamps = [f.timestamp for f in replayed_frames]
    assert all(timestamps[i] < timestamps[i+1] for i in range(len(timestamps)-1))
    
    # Assert source field is "replay"
    assert all(f.source == "replay" for f in replayed_frames)
    
    # Verify replay finished cleanly
    await replay.close()

