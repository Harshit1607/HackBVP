import pytest
import numpy as np
from models.presence import PresenceDetector
from models.pose_stub import PoseStub

def test_presence_detector_logic():
    """Verify that presence detector identifies occupancy based on variance."""
    detector = PresenceDetector(window_len=10, threshold=0.015)
    
    # 1. Low variance (no person)
    for _ in range(15):
        # Std dev of [1.0, 1.0...] is 0.0
        detector.push(0.001)
        
    result_low = detector.predict()
    assert result_low.occupied == False
    assert result_low.person_count == 0
    assert result_low.confidence < 0.3
    
    # 2. High variance (person present)
    for _ in range(15):
        detector.push(0.05)
        
    result_high = detector.predict()
    assert result_high.occupied == True
    assert result_high.person_count == 1
    assert result_high.confidence > 0.8

def test_pose_stub_outputs():
    """Verify that the pose model stub returns empty results as expected."""
    model = PoseStub()
    result = model.predict({})
    
    assert "keypoints" in result
    assert result["keypoints"] is None




