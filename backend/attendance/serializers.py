from rest_framework import serializers
from .models import StudentAttendance, Attendance, AttendanceQRSession

class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = ["id", "lecture", "time"]
        read_only_fields = ["id", "time"]

class StudentAttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentAttendance
        fields = ["id", "attendance", "student", "present", "ip", "device_fingerprint", "location_lat", "location_lon", "scan_time"]
        read_only_fields = ["attendance", "student", "ip", "scan_time"]

class AttendanceQRSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceQRSession
        fields = ["id", "attendance", "token", "created_at", "expires_at"]
        read_only_fields = ["id", "token", "created_at", "expires_at"]
