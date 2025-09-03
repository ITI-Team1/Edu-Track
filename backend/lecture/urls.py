from django.urls import path
from .views import *

urlpatterns = [
    path('', ListLecture.as_view(), name='Lecture-list'),
    path('create/', CreateLecture.as_view(), name='Lecture-create'),
    path('<int:pk>/', RetrieveLecture.as_view(), name='Lecture-retrieve'),
    path('<int:pk>/update/', UpdateLecture.as_view(), name='Lecture-update'),
    path('<int:pk>/delete/', DestoryLecture.as_view(), name='Lecture-destroy'),
    path('enroll/', EnrollStudentInCourses.as_view(), name='enroll-student'),
]