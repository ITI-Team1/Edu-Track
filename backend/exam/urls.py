from django.urls import path
from . import views

app_name = 'exam'

urlpatterns = [
    path('', views.ListLecture.as_view(), name='exam-list'),
    path('create/', views.CreateLecture.as_view(), name='exam-create'),
    path('<int:pk>/', views.RetrieveLecture.as_view(), name='exam-detail'),
    path('<int:pk>/update/', views.UpdateLecture.as_view(), name='exam-update'),
    path('<int:pk>/delete/', views.DestoryLecture.as_view(), name='exam-delete'),
]
