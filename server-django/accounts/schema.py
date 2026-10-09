from drf_spectacular.extensions import OpenApiAuthenticationExtension


class JWTAuthenticationScheme(OpenApiAuthenticationExtension):
    """Tells Swagger that our custom authentication class is a Bearer JWT (adds the Authorize button)."""

    target_class = "accounts.authentication.JWTAuthentication"
    name = "bearerAuth"

    def get_security_definition(self, auto_schema):
        return {"type": "http", "scheme": "bearer", "bearerFormat": "JWT", "description": "JWT from `POST /auth/login`. Expires after 1 hour."}
