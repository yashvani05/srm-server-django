"""
Celery setup: the background worker and the scheduler (Celery Beat).

    celery -A config worker -l info     # runs tasks
    celery -A config beat   -l info     # puts the overdue check on the to-do list every minute

Tasks live in each app's tasks.py and are discovered automatically.
"""
import os

from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

app = Celery("config")
app.config_from_object("django.conf:settings", namespace="CELERY")  # reads every CELERY_* setting
app.autodiscover_tasks()
