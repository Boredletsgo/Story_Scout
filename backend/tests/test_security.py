"""Unit tests for security helpers (hashing + JWT)."""

from __future__ import annotations

import pytest

from app.core.exceptions import AuthenticationError
from app.core.security import (
    TokenType,
    create_access_token,
    decode_token,
    hash_password,
    verify_password,
)


def test_password_hash_roundtrip() -> None:
    hashed = hash_password("supersecret1")
    assert hashed != "supersecret1"
    assert verify_password("supersecret1", hashed)
    assert not verify_password("wrong", hashed)


def test_access_token_decode() -> None:
    token = create_access_token(42, email="a@b.com")
    payload = decode_token(token, TokenType.ACCESS)
    assert payload["sub"] == "42"
    assert payload["type"] == "access"
    assert payload["email"] == "a@b.com"


def test_wrong_token_type_rejected() -> None:
    token = create_access_token(1)
    with pytest.raises(AuthenticationError):
        decode_token(token, TokenType.REFRESH)


def test_invalid_token_rejected() -> None:
    with pytest.raises(AuthenticationError):
        decode_token("not.a.jwt", TokenType.ACCESS)
