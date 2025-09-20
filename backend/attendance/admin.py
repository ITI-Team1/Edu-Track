from django.contrib import admin
from .models import Attendance, StudentAttendance, StudentMark

# Register your models here.
admin.site.register(Attendance)
admin.site.register(StudentAttendance)
admin.site.register(StudentMark)