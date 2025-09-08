from django.apps import AppConfig


class LectureConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'lecture'

    def ready(self):
        # Import signals to ensure post_save hooks are registered
        try:
            import lecture.signals  # noqa: F401
        except Exception:
            # Avoid crashing if imports fail at collectstatic/migrations time
            pass
