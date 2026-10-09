"""
Roles and permissions.

The API (and the React app) talk about permissions like "requests.delete". Django has its own permission system
(Groups + Permissions in the database), which is what we actually use to decide access. This file is the bridge:
`API_PERMISSIONS` maps each API name to the Django permission, and `ROLE_PERMISSIONS` says what each role may do.
The Django permissions themselves are declared on `ServiceRequest.Meta.permissions`, and the two role Groups are
created (and kept in sync with this table) every time you run `python manage.py migrate`.
"""

ADMIN = "ADMIN"
EMPLOYEE = "EMPLOYEE"

# API permission name  ->  Django permission ("app_label.codename")
API_PERMISSIONS = {
    "requests.read": "service_requests.read_requests",
    "requests.create": "service_requests.create_requests",
    "requests.update": "service_requests.update_requests",
    "requests.delete": "service_requests.delete_requests",
    "requests.status.update": "service_requests.update_request_status",
    "dashboard.read": "service_requests.read_dashboard",
}

ROLE_PERMISSIONS = {
    ADMIN: list(API_PERMISSIONS),
    EMPLOYEE: ["requests.read", "requests.create", "requests.update", "dashboard.read"],
}
