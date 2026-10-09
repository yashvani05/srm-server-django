from celery import shared_task

from .overdue import run_overdue_check


@shared_task(
    name="service_requests.tasks.check_overdue",
    autoretry_for=(Exception,),  # a transient failure (e.g. a database blip) is retried...
    retry_backoff=5,             # ...after 5s, 10s, 20s (growing pauses)
    retry_kwargs={"max_retries": 3},
)
def check_overdue() -> dict:
    """Celery Beat adds this to the to-do list every minute; the worker picks it up and runs it."""
    result = run_overdue_check()
    return {"marked": result.marked, "cleared": result.cleared, "durationMs": result.duration_ms}
