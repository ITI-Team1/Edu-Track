from rest_framework.generics import ListAPIView, CreateAPIView, RetrieveAPIView, DestroyAPIView, UpdateAPIView
from rest_framework.views import APIView
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

class CreateStudentAttendance(CreateAPIView):
    queryset = StudentAttendance.objects.all()
    serializer_class = StudentAttendanceSerializer
    permission_classes = [type('CustomPerm',(GroupPermission,),{'required_permission': 'attendance.add_studentattendance'})]

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
        # Allow instructors to update any student attendance, or students to update their own
        instructor_groups = ['دكاترة - معيدين', 'Instructor']  # Support both Arabic and English group names
        if instance.student != request.user and not request.user.groups.filter(name__in=instructor_groups).exists():
            return Response({"error": "You can only mark your own attendance."}, status=status.HTTP_403_FORBIDDEN)
        
        # Update present status if provided
        if 'present' in request.data:
            instance.present = request.data['present']
        
        # Update IP if provided
        ip = request.data.get("ip_address")
        if not ip:  
            x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
            ip = x_forwarded_for.split(",")[0] if x_forwarded_for else request.META.get("REMOTE_ADDR")
        if ip:
            instance.ip = ip
        
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

class CreateStudentMark(CreateAPIView):
    queryset = StudentMark.objects.all()
    serializer_class = StudentMarkSerializer
    permission_classes = [type('CustomPerm',(GroupPermission,),{'required_permission': 'attendance.add_studentmark'})]
    
    def create(self, request, *args, **kwargs):
        # Check if a StudentMark already exists for this student-lecture combination
        student_id = request.data.get('student')
        lecture_id = request.data.get('lecture')
        
        if student_id and lecture_id:
            try:
                existing_mark = StudentMark.objects.get(student_id=student_id, lecture_id=lecture_id)
                # Update the existing record instead of creating a new one
                if 'instructor_mark' in request.data:
                    existing_mark.instructor_mark = float(request.data['instructor_mark'])
                if 'attendance_mark' in request.data:
                    # Make attendance cumulative: add provided amount to existing
                    try:
                        add_amount = float(request.data['attendance_mark'])
                    except (TypeError, ValueError):
                        add_amount = 0.0
                    existing_mark.attendance_mark = float(existing_mark.attendance_mark or 0.0) + add_amount
                existing_mark.save()
                serializer = self.get_serializer(existing_mark)
                return Response(serializer.data, status=status.HTTP_200_OK)
            except StudentMark.DoesNotExist:
                # No existing record, proceed with creation
                pass
        
        return super().create(request, *args, **kwargs)

class UpdateStudentMark(UpdateAPIView):
    queryset = StudentMark.objects.all()
    serializer_class = StudentMarkSerializer
    permission_classes = [type('CustomPerm',(GroupPermission,),{'required_permission': 'attendance.change_studentmark'})]

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', True)
        instance = self.get_object()
        data = request.data.copy()
        # Attendance should be cumulative: add to existing if provided
        if 'attendance_mark' in data:
            try:
                add_amount = float(data.get('attendance_mark') or 0)
            except (TypeError, ValueError):
                add_amount = 0.0
            data['attendance_mark'] = float(instance.attendance_mark or 0.0) + add_amount
        # Instructor mark remains as-set if provided (no change needed)
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

class RecalculateAttendanceMarks(APIView):
    permission_classes = [type('CustomPerm',(GroupPermission,),{'required_permission': 'attendance.change_studentmark'})]
    
    def post(self, request):
        try:
            lecture_id = request.data.get('lecture_id')
            if not lecture_id:
                return Response({"error": "lecture_id is required"}, status=status.HTTP_400_BAD_REQUEST)
            
            # Get all StudentMark records for this lecture
            marks = StudentMark.objects.filter(lecture_id=lecture_id)
            
            # Recalculate new attendance component and ADD it cumulatively to existing values
            for mark in marks:
                # Compute fresh attendance based on current sessions
                previous = float(mark.attendance_mark or 0.0)
                # Temporarily compute new auto value without overwriting previous
                tmp = StudentMark(student=mark.student, lecture=mark.lecture)
                tmp.calculate_attendance_mark()
                new_component = float(tmp.attendance_mark or 0.0)
                # Add new component to previous for cumulative behavior
                mark.attendance_mark = previous + new_component
                mark.final_mark = mark.attendance_mark + mark.instructor_mark
                mark.save()
            
            return Response({
                "message": f"Recalculated attendance marks for {marks.count()} students",
                "updated_count": marks.count()
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

