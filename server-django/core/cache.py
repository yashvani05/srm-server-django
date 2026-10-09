def make_key(key: str, key_prefix: str, version: int) -> str:
    """Readable Redis keys, e.g. `srmdj:dashboard:summary` (Django's default adds a version number in the middle)."""
    return f"{key_prefix}:{key}"
