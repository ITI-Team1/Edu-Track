from django.contrib import admin
from .models import Attendance, StudentAttendance

# Register your models here.
admin.site.register(Attendance)
admin.site.register(StudentAttendance)