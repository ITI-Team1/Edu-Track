from django.db import models
from lecture.models import Lecture
from django.core.exceptions import ValidationError
from django.utils import timezone
from user.models import User

# Create your models here.
weekday = {5: 'السبت', 6: 'الأحد', 0: 'الإثنين', 1: 'الثلاثاء', 2: 'الأربعاء', 3: 'الخميس', 4: 'الجمعة'}

class Attendance(models.Model):
    lecture = models.ForeignKey(Lecture, on_delete=models.CASCADE, related_name="attendances")
    time = models.DateTimeField(auto_now_add=True)

    def clean(self):
        checktime = self.time or timezone.now()
        day = weekday[checktime.weekday()]
        time = checktime.time()
        if day != self.lecture.day:
            raise ValidationError(f"Attendance day must be {self.lecture.day}, not {day}.")
        if not (self.lecture.starttime <= time <= self.lecture.endtime):
            raise ValidationError("Attendance time must be within lecture start and end time.")

    def __str__(self):
        return f"{self.lecture.course.title} - {self.time}"

class StudentAttendance(models.Model):
    attendance = models.ForeignKey(Attendance, on_delete=models.CASCADE, related_name="student_attendances")
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name="student_attendances")
    ip = models.GenericIPAddressField(protocol="both", unpack_ipv4=True, unique=True, null=True)
    present = models.BooleanField(default=False)

    class Meta:
        unique_together = ("attendance", "student")

    def __str__(self):
        return f"{self.student.username} - {self.attendance.lecture.course.title} ({'Present' if self.present else 'Absent'})"