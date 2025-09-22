from rest_framework import serializers
from rest_framework.serializers import ModelSerializer
from .models import Program
from faculty.models import Faculty
from faculty.serializers import FacultySerializer


class ProgramSerializer(ModelSerializer):
    # Accept faculty as an ID on write
    faculty = serializers.PrimaryKeyRelatedField(queryset=Faculty.objects.all())
    # Also expose nested faculty on read for convenience
    faculty_detail = FacultySerializer(source='faculty', read_only=True)

    class Meta:
        model = Program
        fields = ['id', 'name', 'slug', 'faculty', 'faculty_detail']