from rest_framework.permissions import BasePermission

from .roles import API_PERMISSIONS


def require_permission(api_permission: str):
    """
    Builds a DRF permission class: `permission_classes = [require_permission("requests.delete")]`.
    The check is Django's own `user.has_perm(...)`, backed by the user's role Group in the database.
    """
    django_permission = API_PERMISSIONS[api_permission]

    class HasPermission(BasePermission):
        def has_permission(self, request, view):
            return bool(request.user and request.user.has_perm(django_permission))

    HasPermission.__name__ = f"Has_{api_permission.replace('.', '_')}"
    return HasPermission
