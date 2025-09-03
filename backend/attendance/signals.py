from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Attendance, StudentAttendance

@receiver(post_save, sender=Attendance)
def create_student_attendance(sender, instance, created, **kwargs):
    if created:
        students = instance.lecture.students.all()
        for student in students:
            StudentAttendance.objects.get_or_create(attendance=instance, student=student, defaults={"present": False})
