from django.db import models
from django.contrib.auth.models import AbstractUser
from university.models import University
from faculty.models import Faculty
from program.models import Program

# Create your models here.
class User(AbstractUser):
    # Ensure a single account per email
    email = models.EmailField(unique=True)
    englishfullname = models.CharField(max_length=50, blank=True, null=True)
    address = models.CharField(max_length=200, blank=True, null=True)
    picture = models.ImageField(upload_to="pictures", blank=True, null=True)
    phonenumber = models.CharField(max_length=11, blank=True, null=True)
    birthday = models.DateField(blank=True, null=True)
    placeofbirth = models.CharField(max_length=15, blank=True, null=True)
    nationalid = models.CharField(max_length=14, blank=True, null=True)
    nationality = models.CharField(max_length=20, blank=True, null=True)
    zipcode = models.CharField(max_length=8, blank=True, null=True)
    gender = models.CharField(max_length=4, choices=[('ذكر', 'ذكر'), ('أنثى', 'أنثى')], blank=True, null=True)
    maritalstatus = models.CharField(max_length=6, choices=[('أعزب', 'أعزب'), ('عزباء', 'عزباء'), ('متزوج', 'متزوج'), ('متزوجة', 'متزوجة'), ('مطلق', 'مطلق'), ('مطلقة', 'مطلقة'), ('أرمل', 'أرمل'), ('أرملة', 'أرملة')], blank=True, null=True)
    religion = models.CharField(max_length=20, choices=[('مسلم', 'مسلم'), ('مسيحي', 'مسيحي')], blank=True, null=True)
    university = models.ForeignKey(University, on_delete=models.CASCADE, related_name='universities', null=True, blank=True)
    faculty = models.ForeignKey(Faculty, on_delete=models.CASCADE, related_name='faculties', null=True, blank=True)
    program = models.ForeignKey(Program, on_delete=models.CASCADE, related_name='programs', null=True, blank=True)

    def __str__(self):
        return self.username
    
    
    