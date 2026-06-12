import hashlib
import hmac
import json
from urllib.parse import parse_qsl

from fastapi import HTTPException, Request, status

from app.config import settings


def verify_init_data(init_data: str) -> dict:
    """Verify Telegram WebApp initData signature (HMAC-SHA256)."""
    parsed = dict(parse_qsl(init_data, keep_blank_values=True))
    received_hash = parsed.pop("hash", None)
    if not received_hash:
        raise ValueError("Missing hash")

    data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(parsed.items()))
    secret_key = hmac.new(b"WebAppData", settings.bot_token.encode(), hashlib.sha256).digest()
    expected_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

    if not hmac.compare_digest(expected_hash, received_hash):
        raise ValueError("Invalid signature")

    return parsed


def get_current_telegram_user(request: Request) -> dict:
    authorization = request.headers.get("Authorization", "")
    if not authorization.lower().startswith("tma "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
        )

    init_data = authorization[4:]

    try:
        parsed = verify_init_data(init_data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))

    user_str = parsed.get("user")
    if not user_str:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No user in initData")

    return json.loads(user_str)
