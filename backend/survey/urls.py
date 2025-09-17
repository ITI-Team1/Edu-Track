from django.urls import path
from .views import *

urlpatterns = [
    path('', ListSurveyQuestion.as_view(), name='SurveyQuestion-list'),
    path('<int:pk>/', RetrieveSurveyQuestion.as_view(), name='SurveyQuestion-retrieve'),
    path('answers/', ListSurveyAnswer.as_view(), name='SurveyAnswer-list'),
    path('answers/create/', CreateSurveyAnswer.as_view(), name='SurveyAnswer-create'),
    path('answers/<int:pk>/', RetrieveSurveyAnswer.as_view(), name='SurveyAnswer-retrieve'),
]

