"""
The overdue check: the single place that decides what "overdue" means.

A request is overdue when it is OPEN or IN_PROGRESS and has been in that status for more than 24 hours.
This runs inside the Celery worker every minute (see tasks.py). It is:
  * idempotent  - it only touches rows whose flag is wrong, so running it twice changes nothing the second time;
  * atomic      - everything, including recording "last success", happens in ONE database transaction, so a run
                  that fails half-way rolls back completely and never records a false success.
"""
import logging
import time
from dataclasses import dataclass
from datetime import timedelta

from django.db import transaction
from django.db.models import DateTimeField, ExpressionWrapper, Q
from django.db.models.functions import Now

from dashboard import cache as dashboard_cache

from .constants import OVERDUE_AFTER_HOURS
from .models import ServiceRequest, SystemState

logger = logging.getLogger(__name__)

STATE_KEY = "overdue_check.last_success_at"


def qualifies_as_overdue() -> Q:
    """SQL condition: open / in progress for longer than 24h. Uses the database clock (Now()) so every writer agrees."""
    cutoff = ExpressionWrapper(Now() - timedelta(hours=OVERDUE_AFTER_HOURS), output_field=DateTimeField())
    return Q(status__in=[ServiceRequest.Status.OPEN, ServiceRequest.Status.IN_PROGRESS], status_changed_at__lt=cutoff)


@dataclass
class OverdueCheckResult:
    marked: int      # requests newly flagged overdue by this run
    cleared: int     # stale flags removed by this run
    duration_ms: int


def run_overdue_check() -> OverdueCheckResult:
    started = time.monotonic()
    with transaction.atomic():
        # 1. Flag requests that have now been OPEN / IN_PROGRESS for more than 24h and are not flagged yet.
        marked = ServiceRequest.objects.filter(overdue=False).filter(qualifies_as_overdue()).update(overdue=True, overdue_at=Now())
        # 2. Safety net: nothing may stay flagged unless it still qualifies (a RESOLVED request is never overdue).
        #    Normal status changes already clear the flag at once; this heals anything that slipped through.
        cleared = ServiceRequest.objects.filter(overdue=True).exclude(qualifies_as_overdue()).update(overdue=False, overdue_at=None)
        # 3. Record success (same transaction => it is only committed if the work above was).
        SystemState.objects.update_or_create(key=STATE_KEY, defaults={"value": "ok", "updated_at": Now()})

    if marked or cleared:  # the dashboard's overdue count changed, so drop the cached summary (after commit)
        dashboard_cache.invalidate()

    result = OverdueCheckResult(marked=marked, cleared=cleared, duration_ms=int((time.monotonic() - started) * 1000))
    logger.info("Overdue check finished: marked=%s cleared=%s in %sms", result.marked, result.cleared, result.duration_ms)
    return result
