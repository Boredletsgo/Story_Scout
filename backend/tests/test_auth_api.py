"""Integration tests for the auth + user API."""

from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_register_and_login(client: AsyncClient) -> None:
    reg = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "newuser@bookmind.ai",
            "username": "newuser",
            "full_name": "New User",
            "password": "password123",
        },
    )
    assert reg.status_code == 201
    assert reg.json()["email"] == "newuser@bookmind.ai"

    login = await client.post(
        "/api/v1/auth/login",
        json={"email": "newuser@bookmind.ai", "password": "password123"},
    )
    assert login.status_code == 200
    body = login.json()
    assert "access_token" in body
    assert "refresh_token" in body


@pytest.mark.asyncio
async def test_duplicate_email_rejected(client: AsyncClient) -> None:
    payload = {
        "email": "dup@bookmind.ai",
        "username": "dup",
        "password": "password123",
    }
    first = await client.post("/api/v1/auth/register", json=payload)
    assert first.status_code == 201
    second = await client.post(
        "/api/v1/auth/register",
        json={**payload, "username": "dup2"},
    )
    assert second.status_code == 409


@pytest.mark.asyncio
async def test_me_requires_auth(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/users/me")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_me_with_auth(auth_client: AsyncClient) -> None:
    resp = await auth_client.get("/api/v1/users/me")
    assert resp.status_code == 200
    assert resp.json()["username"] == "tester"


@pytest.mark.asyncio
async def test_update_preferences(auth_client: AsyncClient) -> None:
    resp = await auth_client.put(
        "/api/v1/users/me/preferences",
        json={"favorite_genres": ["Fantasy", "Romance"], "disliked_tropes": ["love triangle"]},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["favorite_genres"] == ["Fantasy", "Romance"]
    assert body["disliked_tropes"] == ["love triangle"]
