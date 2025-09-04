from django.db import models
from faculty.models import Faculty

# Create your models here.
class Location(models.Model):
    name = models.CharField(max_length=50)
    slug = models.SlugField(unique=True)
    capacity = models.PositiveIntegerField(default=1)
    faculties = models.ManyToManyField(Faculty, related_name='locations')

    def __str__(self):
        faculty_names = ", ".join([faculty.name for faculty in self.faculties.all()])
        return f"{self.name} ({faculty_names})"