from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

from .denylist import is_denied
from .jwt import decode_token
from .models import User


class JWTAuthentication(BaseAuthentication):
    """Reads `Authorization: Bearer <token>`, checks it, and loads the user. Runs automatically on every request."""

    def authenticate(self, request):
        header = request.headers.get("Authorization", "")
        if not header.startswith("Bearer "):
            return None  # no token: the request is anonymous (protected endpoints then answer 401)

        claims = decode_token(header[len("Bearer "):].strip())
        if is_denied(claims["jti"]):
            raise AuthenticationFailed("Token has been revoked")

        user = User.objects.filter(pk=claims["sub"], is_active=True).first()
        if user is None:
            raise AuthenticationFailed("Invalid token")
        return user, claims  # request.user, request.auth

    def authenticate_header(self, request):
        return "Bearer"  # makes DRF answer 401 (not 403) when authentication is missing
