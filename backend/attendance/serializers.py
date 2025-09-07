from rest_framework import serializers
from .models import StudentAttendance, Attendance

class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = ["id", "lecture", "time"]
        read_only_fields = ["id", "time"]

class StudentAttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentAttendance
        fields = ["id", "attendance", "student", "present"]
        read_only_fields = ["attendance", "student"]
