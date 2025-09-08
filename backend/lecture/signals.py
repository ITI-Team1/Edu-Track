from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Lecture

@receiver(post_save, sender=Lecture)
def propagate_course_students_to_new_lecture(sender, instance: Lecture, created: bool, **kwargs):
    """
    When a new Lecture is created for a course that already has enrolled students
    on other lectures, propagate those students to the new lecture automatically.
    This ensures consistency so new lectures immediately reflect course enrollment.
    """
    if not created:
        return

    # Collect distinct student IDs from other lectures of the same course
    other_student_ids = (
        Lecture.objects
        .filter(course=instance.course)
        .exclude(pk=instance.pk)
        .values_list('students', flat=True)
        .distinct()
    )
    # Filter out Nones and convert to list
    student_ids = [sid for sid in other_student_ids if sid is not None]
    if not student_ids:
        return

    # Add them to the new lecture
    instance.students.add(*student_ids)
