import pytest
import asyncio
from httpx import AsyncClient, ASGITransport
from main import app
from state import sensing_state

@pytest.mark.asyncio
async def test_api_health_check_endpoint():
    """Verify health endpoint structure and successful response."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "has_data" in data

@pytest.mark.asyncio
async def test_api_sensing_latest_warmup():
    """Verify that latest frame endpoint returns 503 when warming up."""
    # Ensure current frame state is empty for test
    sensing_state.latest_frame = None
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/sensing/latest")
        assert response.status_code == 503
        assert response.json()["detail"] == "Sensing engine warming up..."

@pytest.mark.asyncio
async def test_api_sessions_list_endpoint():
    """Verify that sessions endpoint returns an array."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/sessions")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

@pytest.mark.asyncio
async def test_api_sessions_stop_endpoint():
    """Verify that stopping a session resets the source and returns success."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/sessions/stop")
        assert response.status_code == 200
        assert response.json()["status"] == "live"




