from django.urls import path
from .views import *

urlpatterns = [
    path('', ListAttendance.as_view(), name='Attendance-list'),
    path('create/', CreateAttendance.as_view(), name='Attendance-create'),
    path('<int:pk>/', RetrieveAttendance.as_view(), name='Attendance-retrieve'),
    path('students/', ListStudentAttendance.as_view(), name='StudentAttendance-list'),
    path('students/create/', CreateStudentAttendance.as_view(), name='StudentAttendance-create'),
    path('students/<int:pk>/', RetrieveStudentAttendance.as_view(), name='StudentAttendance-retrieve'),
    path('students/<int:pk>/update/', UpdateStudentAttendance.as_view(), name='StudentAttendance-update'),
    path('marks/', ListStudentMark.as_view(), name='StudentMark-list'),
    path('marks/create/', CreateStudentMark.as_view(), name='StudentMark-create'),
    path('marks/<int:pk>/', RetrieveStudentMark.as_view(), name='StudentMark-retrieve'),
    path('marks/<int:pk>/update/', UpdateStudentMark.as_view(), name='StudentMark-update'),
    path('marks/recalculate/', RecalculateAttendanceMarks.as_view(), name='StudentMark-recalculate'),
]
