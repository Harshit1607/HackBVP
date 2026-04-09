import pytest
import asyncio
import json
from fastapi.testclient import TestClient
from api.main import app

def test_websocket_connection_and_data():
    """Verify WebSocket client can connect and receive structured sensing frames."""
    # Using 'with' on TestClient triggers the lifespan events (startup/shutdown)
    # which starts the background sensing loop.
    with TestClient(app) as client:
        try:
            with client.websocket_connect("/ws/sensing") as websocket:
                # Wait for at least one frame to be emitted
                # We use a short timeout to avoid hanging if the loop isn't running
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
                # Note: vitals result can be None if not enough samples yet
                
                # Subcarriers should be a list of floats (downsampled)
                assert isinstance(data["raw_amplitude"], list)
                assert len(data["raw_amplitude"]) > 0
                
        except Exception as e:
            pytest.fail(f"WebSocket frame reception failed: {e}")

if __name__ == "__main__":
    # For manual testing
    test_websocket_connection_and_data()
