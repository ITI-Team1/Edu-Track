from django.db import models
from university.models import University
from faculty.models import Faculty
from program.models import Program

# Create your models here.
class ExamTable(models.Model):
    university = models.ForeignKey(University, on_delete=models.CASCADE, related_name='examtables')
    faculty = models.ForeignKey(Faculty, on_delete=models.CASCADE, related_name='examtables')
    program = models.ForeignKey(Program, on_delete=models.CASCADE, related_name='examtables')
    image = models.ImageField(upload_to='exams')

    def __str__(self):
        return f'exam - {self.faculty.name} - {self.program.name}'
        