import pytest
import asyncio
import json
from fastapi.testclient import TestClient
from main import app

def test_websocket_connection_and_data():
    """Verify WebSocket client can connect and receive structured sensing frames."""
    client = TestClient(app)
    
    with client.websocket_connect("/ws/sensing") as websocket:
        import time
        time.sleep(1.0)
        try:
            data = websocket.receive_json()
            
            # Check for required fields
            assert "frame_id" in data
            assert "timestamp" in data
            assert "source" in data
            assert "vitals" in data
            assert "presence" in data
            assert "raw_amplitude" in data
            
            # Check vitals field types
            vitals = data["vitals"]
            assert "breathing_bpm" in vitals
            assert vitals["breathing_bpm"] is None or isinstance(vitals["breathing_bpm"], (int, float))
            assert "heart_rate_bpm" in vitals
            assert vitals["heart_rate_bpm"] is None or isinstance(vitals["heart_rate_bpm"], (int, float))
            
            # Subcarriers should be a list of floats (downsampled)
            assert isinstance(data["raw_amplitude"], list)
            assert len(data["raw_amplitude"]) > 0
            
        except Exception as e:
            pytest.fail(f"WebSocket frame reception failed: {e}")

if __name__ == "__main__":
    # For manual testing
    test_websocket_connection_and_data()




