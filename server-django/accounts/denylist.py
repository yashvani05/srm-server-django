"""
Real logout. A JWT cannot be "un-issued", so on logout we remember its id (jti) in Redis until it would have
expired anyway, and every request checks that list first. Redis deletes each entry by itself when its timer runs out.
"""
import logging
import time

from django.core.cache import cache

from core.exceptions import ServiceUnavailable

logger = logging.getLogger(__name__)


def _key(jti: str) -> str:
    return f"auth:denylist:{jti}"


def deny(jti: str, expires_at: int) -> None:
    ttl = int(expires_at - time.time())
    if ttl > 0:
        cache.set(_key(jti), 1, timeout=ttl)


def is_denied(jti: str) -> bool:
    try:
        return cache.get(_key(jti)) is not None
    except Exception:
        # Fail closed: if we cannot confirm the token was not revoked, we do not let it through.
        logger.exception("Token denylist (Redis) unavailable")
        raise ServiceUnavailable("Authentication service temporarily unavailable")
