from django.contrib import admin
from .models import *

# Register your models here.
admin.site.register(SurveyQuestion)
admin.site.register(SurveyAnswer)