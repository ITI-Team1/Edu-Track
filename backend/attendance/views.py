from rest_framework.generics import ListAPIView, CreateAPIView, RetrieveAPIView, DestroyAPIView, UpdateAPIView
from user.permissions import GroupPermission
from .models import StudentAttendance, Attendance, StudentMark
from .serializers import StudentAttendanceSerializer, AttendanceSerializer, StudentMarkSerializer
from rest_framework.response import Response
from rest_framework import status

# Create your views here.
class ListAttendance(ListAPIView):
    queryset =  Attendance.objects.all()
    serializer_class = AttendanceSerializer
    permission_classes = [type('CustomPerm',(GroupPermission,),{'required_permission': 'attendance.view_attendance'})]

class CreateAttendance(CreateAPIView):
    queryset =  Attendance.objects.all()
    serializer_class = AttendanceSerializer
    permission_classes = [type('CustomPerm',(GroupPermission,),{'required_permission': 'attendance.add_attendance'})]

class RetrieveAttendance(RetrieveAPIView):
    queryset =  Attendance.objects.all()
    serializer_class = AttendanceSerializer
    permission_classes = [type('CustomPerm',(GroupPermission,),{'required_permission': 'attendance.view_attendance'})]

class ListStudentAttendance(ListAPIView):
    queryset =  StudentAttendance.objects.all()
    serializer_class = StudentAttendanceSerializer
    permission_classes = [type('CustomPerm',(GroupPermission,),{'required_permission': 'attendance.view_studentattendance'})]

class RetrieveStudentAttendance(RetrieveAPIView):
    queryset =  StudentAttendance.objects.all()
    serializer_class = StudentAttendanceSerializer
    permission_classes = [type('CustomPerm',(GroupPermission,),{'required_permission': 'attendance.view_studentattendance'})]

class UpdateStudentAttendance(UpdateAPIView):
    queryset =  StudentAttendance.objects.all()
    serializer_class = StudentAttendanceSerializer
    permission_classes = [type('CustomPerm',(GroupPermission,),{'required_permission': 'attendance.change_studentattendance'})]

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.student != request.user:
            return Response({"error": "You can only mark your own attendance."}, status=status.HTTP_403_FORBIDDEN)
        instance.present = True
        ip = request.data.get("ip_address")
        if not ip:  
            x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
            ip = x_forwarded_for.split(",")[0] if x_forwarded_for else request.META.get("REMOTE_ADDR")
        instance.ip_address = ip
        instance.save()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

class ListStudentMark(ListAPIView):
    queryset =  StudentMark.objects.all()
    serializer_class = StudentMarkSerializer
    permission_classes = [type('CustomPerm',(GroupPermission,),{'required_permission': 'attendance.view_studentmark'})]

class RetrieveStudentMark(RetrieveAPIView):
    queryset =  StudentMark.objects.all()
    serializer_class = StudentMarkSerializer
    permission_classes = [type('CustomPerm',(GroupPermission,),{'required_permission': 'attendance.view_studentmark'})]

class UpdateStudentMark(UpdateAPIView):
    queryset =  StudentMark.objects.all()
    serializer_class = StudentMarkSerializer
    permission_classes = [type('CustomPerm',(GroupPermission,),{'required_permission': 'attendance.change_studentmark'})]

