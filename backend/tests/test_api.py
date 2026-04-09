import os
import pytest
import json
import httpx
from api.main import app
import config as config
from api.state import sensing_state
from simulator.csi_generator import CSISimulator

@pytest.fixture
def anyio_backend():
    return "asyncio"

@pytest.fixture
async def client():
    # Modern httpx uses ASGITransport for testing app directly
    try:
        transport = httpx.ASGITransport(app=app)
    except AttributeError:
        # Fallback for older httpx
        async with httpx.AsyncClient(app=app, base_url="http://test") as client:
            yield client
            return
            
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        yield client

@pytest.mark.anyio
async def test_api_status_initial(client):
    response = await client.get("/api/status")
    assert response.status_code == 200
    data = response.json()
    assert data["mode"] == "live"
    assert data["recording"] is not None

@pytest.mark.anyio
async def test_api_sessions_empty(client, tmp_path):
    # Mock RECORDINGS_DIR for this test
    config.RECORDINGS_DIR = str(tmp_path / "empty_dir")
    response = await client.get("/api/sessions")
    assert response.status_code == 200
    assert response.json() == []

@pytest.mark.anyio
async def test_api_sessions_with_files(client, tmp_path):
    # Mock RECORDINGS_DIR
    temp_rec_dir = tmp_path / "filled_dir"
    os.makedirs(temp_rec_dir, exist_ok=True)
    config.RECORDINGS_DIR = str(temp_rec_dir)
    
    # Create fixture session file
    test_file = temp_rec_dir / "1712345678_test.jsonl"
    with open(test_file, "w") as f:
        f.write('{"timestamp": 0.0, "amplitudes": []}\n')
        
    response = await client.get("/api/sessions")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["filename"] == "1712345678_test.jsonl"
    assert "size_kb" in data[0]
    assert "created_at" in data[0]

@pytest.mark.anyio
async def test_api_sessions_stop(client):
    response = await client.post("/api/sessions/stop")
    assert response.status_code == 200
    expected = {"status": "live"}
    assert response.json() == expected
    
    status_resp = await client.get("/api/status")
    assert status_resp.json()["mode"] == "live"

@pytest.mark.anyio
async def test_api_sessions_play_validations(client, tmp_path):
    # Setup recordings dir
    config.RECORDINGS_DIR = str(tmp_path)
    
    # Test nonexistent
    response = await client.post("/api/sessions/missing.jsonl/play")
    assert response.status_code == 404
    
    # Test path traversal
    response = await client.post("/api/sessions/..%2f..%2fetc%2fpasswd/play")
    assert response.status_code == 400
    
    # Test invalid speed
    response = await client.post("/api/sessions/any.jsonl/play?speed=0.1")
    assert response.status_code == 422
