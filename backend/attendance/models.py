from django.db import models
from lecture.models import Lecture
from django.core.exceptions import ValidationError
from django.utils import timezone
from user.models import User
from lecture.models import Lecture

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
    

class StudentMark(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name="marks")
    lecture = models.ForeignKey(Lecture, on_delete=models.CASCADE, related_name="marks")
    attendance_mark = models.FloatField(default=0.0)
    instructor_mark = models.FloatField(default=0.0)
    final_mark = models.FloatField(default=0.0, editable=False)
    class Meta:
        unique_together = ("student", "lecture")

    def calculate_attendance_mark(self):
        # Count total attendance sessions for this lecture
        total_attendance_sessions = Attendance.objects.filter(lecture=self.lecture).count()
        
        # Count how many times this student was present in this lecture
        attended_sessions = StudentAttendance.objects.filter(
            attendance__lecture=self.lecture, 
            student=self.student, 
            present=True
        ).count()
        
        # Get the weight from lecture, default to 10 if not set
        weight = getattr(self.lecture, 'weight', 10)
        
        if total_attendance_sessions > 0:
            percentage = attended_sessions / total_attendance_sessions
            self.attendance_mark = round(percentage * weight, 2)
        else:
            self.attendance_mark = 0.0

    def save(self, *args, **kwargs):
        self.calculate_attendance_mark()
        self.final_mark = self.attendance_mark + self.instructor_mark
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.student.username} - {self.final_mark}"