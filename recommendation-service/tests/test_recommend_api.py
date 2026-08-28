import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "running"


def test_health_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["ok", "degraded"]
    assert "engine" in data


def test_post_course_endpoint():
    # Test Phase 4 required POST /course endpoint
    response = client.post("/course", json={"user_id": 1, "limit": 4})
    assert response.status_code == 200
    data = response.json()
    assert "course_ids" in data
    assert "scores" in data
    assert isinstance(data["course_ids"], list)
    assert isinstance(data["scores"], list)


def test_guest_recommendations():
    response = client.get("/api/v1/recommendations/guest?limit=3")
    assert response.status_code == 200
    data = response.json()
    assert "recommendations" in data
    assert isinstance(data["recommendations"], list)


def test_user_recommendations():
    response = client.get("/api/v1/recommendations/user/1?limit=3")
    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == 1
    assert "recommendations" in data
    assert isinstance(data["recommendations"], list)


def test_post_recommendations():
    response = client.post("/api/v1/recommend", json={"user_id": 1, "limit": 3})
    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == 1
    assert "recommendations" in data
