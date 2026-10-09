from rest_framework.throttling import SimpleRateThrottle


class LoginThrottle(SimpleRateThrottle):
    """Brute-force protection: at most LOGIN_RATE_LIMIT_MAX login attempts per IP address per 15 minutes."""

    scope = "login"

    def parse_rate(self, rate):
        count, _ = rate.split("/")  # our rate string looks like "10/15min"
        return int(count), 15 * 60

    def get_cache_key(self, request, view):
        return self.cache_format % {"scope": self.scope, "ident": self.get_ident(request)}
