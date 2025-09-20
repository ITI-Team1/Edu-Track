from rest_framework import serializers
from .models import StudentAttendance, Attendance, StudentMark

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

class StudentMarkSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentMark
        fields = '__all__'
        read_only_fields = ("attendance_mark", "final_mark")
