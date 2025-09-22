from django.db import models
from user.models import User
from course.models import Course
from location.models import Location

# Create your models here.
days = [
    ('السبت', 'السبت'), ('الأحد', 'الأحد'), ('الإثنين', 'الإثنين'), ('الثلاثاء', 'الثلاثاء'),
    ('الأربعاء', 'الأربعاء'), ('الخميس', 'الخميس'), ('الجمعة', 'الجمعة'),
]

class Lecture(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="lectures")
    instructor = models.ManyToManyField(User, related_name="lectures_taught", blank=True)
    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name="lectures")
    day = models.CharField(max_length=10, choices=days)
    starttime = models.TimeField()
    endtime = models.TimeField()
    weight = models.FloatField(default=0.0)
    students = models.ManyToManyField(User, related_name='lectures_attended', null=True)

    def __str__(self):
        return f"{self.course.title} - {self.location.name}"
    


