from rest_framework.generics import ListAPIView, CreateAPIView, RetrieveAPIView, DestroyAPIView, UpdateAPIView
from user.permissions import GroupPermission
from .models import StudentAttendance, Attendance, AttendanceQRSession
from lecture.models import Lecture
from .serializers import StudentAttendanceSerializer, AttendanceSerializer, AttendanceQRSessionSerializer
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from django.utils import timezone
from django.db import transaction
from .security import generate_qr_token, token_expiry, is_egypt_ip, hash_fingerprint, validate_geo, sign_join_payload, verify_join_signature
import secrets
from django.shortcuts import get_object_or_404
from django.conf import settings

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
            return Response({"error": "لا يمكنك تسجيل حضور طالب آخر"}, status=status.HTTP_403_FORBIDDEN)
        # Validate Egypt IP
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        ip = request.data.get("ip") or (x_forwarded_for.split(",")[0] if x_forwarded_for else request.META.get("REMOTE_ADDR"))
        # During local development allow marking from any IP to enable LAN/mobile testing
        from django.conf import settings as dj_settings
        if not dj_settings.DEBUG and not is_egypt_ip(ip):
            return Response({"error": "يجب أن يتم التسجيل من داخل مصر"}, status=status.HTTP_403_FORBIDDEN)
        # Validate rotating token
        token = request.data.get("token")
        if not token:
            return Response({"error": "رمز مفقود"}, status=status.HTTP_400_BAD_REQUEST)
        valid_session = AttendanceQRSession.objects.filter(attendance=instance.attendance, token=token, expires_at__gte=timezone.now()).first()
        if not valid_session:
            return Response({"error": "رمز غير صالح أو منتهي"}, status=status.HTTP_400_BAD_REQUEST)
        # Geo + fingerprint checks (soft enforcement)
        lat = request.data.get("lat")
        lon = request.data.get("lon")
        try:
            lat_v = float(lat) if lat is not None else None
            lon_v = float(lon) if lon is not None else None
        except ValueError:
            lat_v = lon_v = None
        fp_raw = request.data.get("fingerprint") or ""
        fp_hash = hash_fingerprint(fp_raw) if fp_raw else None
        if instance.present:
            return Response({"detail": "تم تسجيل الحضور مسبقاً"}, status=status.HTTP_200_OK)
        instance.present = True
        instance.ip = ip
        instance.device_fingerprint = fp_hash
        instance.location_lat = lat_v
        instance.location_lon = lon_v
        instance.user_agent = request.META.get("HTTP_USER_AGENT", "")[:255]
        instance.scan_time = timezone.now()
        instance.save(update_fields=["present", "ip", "device_fingerprint", "location_lat", "location_lon", "user_agent", "scan_time"])
        serializer = self.get_serializer(instance)
        return Response(serializer.data, status=status.HTTP_200_OK)

class GenerateQRToken(APIView):
    permission_classes = [type('CustomPerm',(GroupPermission,),{'required_permission': 'attendance.change_attendance'})]

    def post(self, request, attendance_id: int):
        attendance = get_object_or_404(Attendance, pk=attendance_id)
        # Rotate: create new token and prune old (still stored for security / optional legacy flow)
        token = generate_qr_token()
        expires = token_expiry(10)
        with transaction.atomic():
            AttendanceQRSession.objects.create(attendance=attendance, token=token, expires_at=expires)
            AttendanceQRSession.objects.filter(attendance=attendance, expires_at__lt=timezone.now()).delete()
        # Add a signed deep link token (valid for same window) for optional direct join without camera
        join_nonce = secrets.token_urlsafe(8)
        join_sig = sign_join_payload(attendance.id, join_nonce, expires)
        # Deep link path (frontend will build full URL); we now also encode this link in the QR instead of raw token
        deep_link_path = f"/attendance/join?att={attendance.id}&j={join_sig}"
        return Response({"token": token, "expires_at": expires, "join_link": deep_link_path}, status=status.HTTP_201_CREATED)

class ListLectureAttendance(APIView):
    permission_classes = [type('CustomPerm',(GroupPermission,),{'required_permission': 'attendance.view_studentattendance'})]

    def get(self, request, attendance_id: int):
        attendance = get_object_or_404(Attendance, pk=attendance_id)
        # Ensure StudentAttendance rows exist for all enrolled students
        created = 0
        for student in attendance.lecture.students.all():
            StudentAttendance.objects.get_or_create(attendance=attendance, student=student)
        qs = attendance.student_attendances.select_related('student').all().order_by('student__username')
        data = [
            {
                "id": sa.id,
                "student_id": sa.student_id,
                "username": sa.student.username,
                "present": sa.present,
            } for sa in qs
        ]
        return Response({"students": data})

class GetMyStudentAttendance(APIView):
    permission_classes = [type('CustomPerm',(GroupPermission,),{'required_permission': 'attendance.view_studentattendance'})]

    def get(self, request, attendance_id: int):
        attendance = get_object_or_404(Attendance, pk=attendance_id)
        if request.user not in attendance.lecture.students.all():
            return Response({"error": "لست مسجلاً في هذه المحاضرة"}, status=status.HTTP_403_FORBIDDEN)
        sa, _ = StudentAttendance.objects.get_or_create(attendance=attendance, student=request.user)
        serializer = StudentAttendanceSerializer(sa)
        return Response(serializer.data)

class LectureActiveAttendance(APIView):
    """Return (and if missing create) the current attendance session for a lecture.
    Superadmins/instructors can hit this with a lecture id instead of needing an attendance id.
    """
    permission_classes = [type('CustomPerm',(GroupPermission,),{'required_permission': 'attendance.change_attendance'})]

    def get(self, request, lecture_id: int):
        lecture = get_object_or_404(Lecture, pk=lecture_id)
        att = lecture.attendances.order_by('-time').first()
        if not att:
            # Create a fresh attendance record (will validate timing rules)
            att = Attendance(lecture=lecture)
            try:
                att.full_clean()
            except Exception:
                # Ignore validation errors for now to guarantee an id (could return 400 with message instead)
                pass
            att.save()
        serializer = AttendanceSerializer(att)
        return Response(serializer.data)

class JoinAttendanceViaLink(APIView):
    """Endpoint for students visiting a deep link (e.g., from scanning a QR encoded URL) to mark attendance directly."""
    permission_classes = [type('CustomPerm',(GroupPermission,),{'required_permission': 'attendance.view_studentattendance'})]

    def post(self, request):
        attendance_id = request.data.get('att')
        join_token = request.data.get('j')
        if not (attendance_id and join_token):
            return Response({'error': 'بيانات ناقصة'}, status=400)
        attendance = get_object_or_404(Attendance, pk=attendance_id)
        if request.user not in attendance.lecture.students.all():
            return Response({'error': 'لست مسجلاً في هذه المحاضرة'}, status=403)
        if not verify_join_signature(attendance.id, join_token):
            return Response({'error': 'رابط غير صالح أو منتهي'}, status=400)
        sa, _ = StudentAttendance.objects.get_or_create(attendance=attendance, student=request.user)
        if sa.present:
            return Response({'detail': 'تم تسجيل الحضور مسبقاً'})
        sa.present = True
        sa.scan_time = timezone.now()
        sa.save(update_fields=['present', 'scan_time'])
        return Response({'detail': 'تم التسجيل', 'attendance': sa.id})

class InstructorOverrideAttendance(APIView):
    """Allow instructor / superadmin to toggle a student's attendance manually."""
    permission_classes = [type('CustomPerm',(GroupPermission,),{'required_permission': 'attendance.change_studentattendance'})]

    def post(self, request, attendance_id: int, student_id: int):
        attendance = get_object_or_404(Attendance, pk=attendance_id)
        # Ensure requesting user is instructor for the lecture or superuser
        if not (request.user.is_superuser or attendance.lecture.instructor_id == request.user.id):
            return Response({'error': 'ليس لديك صلاحية'}, status=403)
        sa, _ = StudentAttendance.objects.get_or_create(attendance=attendance, student_id=student_id)
        present = request.data.get('present')
        if present is None:
            return Response({'error': 'حدد present=true/false'}, status=400)
        sa.present = bool(present)
        if sa.present and not sa.scan_time:
            sa.scan_time = timezone.now()
        sa.save(update_fields=['present', 'scan_time'])
        return Response({'id': sa.id, 'student': sa.student_id, 'present': sa.present})

