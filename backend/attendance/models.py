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

class AttendanceQRSession(models.Model):
    """Ephemeral rotating token for an attendance window.
    A new row can be generated every X seconds; old tokens expire quickly.
    """
    attendance = models.ForeignKey(Attendance, on_delete=models.CASCADE, related_name="qr_sessions")
    token = models.CharField(max_length=64, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        indexes = [
            models.Index(fields=["token", "attendance"]),
            models.Index(fields=["expires_at"])
        ]

    def __str__(self):
        return f"QRSession {self.attendance_id} {self.token[:8]}..."

class StudentAttendance(models.Model):
    attendance = models.ForeignKey(Attendance, on_delete=models.CASCADE, related_name="student_attendances")
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name="student_attendances")
    # IP captured at first successful scan (not unique because multiple students will share same campus gateway)
    ip = models.GenericIPAddressField(protocol="both", unpack_ipv4=True, null=True, blank=True)
    device_fingerprint = models.CharField(max_length=128, null=True, blank=True)
    location_lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    location_lon = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    user_agent = models.CharField(max_length=256, null=True, blank=True)
    scan_time = models.DateTimeField(null=True, blank=True)
    present = models.BooleanField(default=False)

    class Meta:
        unique_together = ("attendance", "student")

    def __str__(self):
        return f"{self.student.username} - {self.attendance.lecture.course.title} ({'Present' if self.present else 'Absent'})"