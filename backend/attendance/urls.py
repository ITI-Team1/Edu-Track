from django.urls import path
from .views import *

urlpatterns = [
    path('', ListAttendance.as_view(), name='Attendance-list'),
    path('create/', CreateAttendance.as_view(), name='Attendance-create'),
    path('<int:pk>/', RetrieveAttendance.as_view(), name='Attendance-retrieve'),
    path('students/', ListStudentAttendance.as_view(), name='StudentAttendance-list'),
    path('students/<int:pk>/', RetrieveStudentAttendance.as_view(), name='StudentAttendance-retrieve'),
    path('students/<int:pk>/update/', UpdateStudentAttendance.as_view(), name='StudentAttendance-update'),
    path('<int:attendance_id>/qr/rotate/', GenerateQRToken.as_view(), name='Attendance-generate-qr'),
    path('<int:attendance_id>/students/list/', ListLectureAttendance.as_view(), name='Attendance-students'),
    path('<int:attendance_id>/students/me/', GetMyStudentAttendance.as_view(), name='Attendance-student-me'),
    path('lecture/<int:lecture_id>/active/', LectureActiveAttendance.as_view(), name='Lecture-active-attendance'),
    path('join/', JoinAttendanceViaLink.as_view(), name='Attendance-join-link'),
    path('<int:attendance_id>/override/<int:student_id>/', InstructorOverrideAttendance.as_view(), name='Attendance-override'),
]
