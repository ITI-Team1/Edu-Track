from rest_framework.serializers import ModelSerializer
from .models import ExamTable
from university.serializers import UniversitySerializer
from faculty.serializers import FacultySerializer
from program.serializers import ProgramSerializer

class ExamTableSerializer(ModelSerializer):
    university_data = UniversitySerializer(source='university', read_only=True)
    faculty_data = FacultySerializer(source='faculty', read_only=True)
    program_data = ProgramSerializer(source='program', read_only=True)
    
    class Meta:
        model = ExamTable
        fields = ['id', 'university', 'faculty', 'program', 'image', 'university_data', 'faculty_data', 'program_data']
        extra_kwargs = {
            'university': {'write_only': True},
            'faculty': {'write_only': True},
            'program': {'write_only': True},
        }
