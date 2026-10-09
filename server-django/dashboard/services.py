from django.db.models import Count, Q

from service_requests.models import ServiceRequest, SystemState
from service_requests.overdue import STATE_KEY

S = ServiceRequest.Status


def build_summary() -> dict:
    """All counts come from ONE aggregate query."""
    counts = ServiceRequest.objects.aggregate(
        total=Count("id"),
        open=Count("id", filter=Q(status=S.OPEN)),
        inProgress=Count("id", filter=Q(status=S.IN_PROGRESS)),
        resolved=Count("id", filter=Q(status=S.RESOLVED)),
        high=Count("id", filter=Q(priority=ServiceRequest.Priority.HIGH)),
        overdue=Count("id", filter=Q(overdue=True)),
    )
    return {
        "total": counts["total"], "open": counts["open"], "inProgress": counts["inProgress"],
        "resolved": counts["resolved"], "highPriority": counts["high"], "overdue": counts["overdue"],
    }


def last_overdue_check_at():
    """Read fresh every time (never cached) so the dashboard shows when the worker really last succeeded."""
    state = SystemState.objects.filter(key=STATE_KEY).first()
    return state.updated_at if state else None
