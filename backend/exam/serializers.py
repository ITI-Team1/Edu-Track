from rest_framework.serializers import ModelSerializer
from .models import ExamTable
from university.serializers import UniversitySerializer
from faculty.serializers import FacultySerializer
from program.serializers import ProgramSerializer

class ExamTableSerializer(ModelSerializer):
    university = UniversitySerializer(read_only=True)
    faculty = FacultySerializer(read_only=True)
    program = ProgramSerializer(read_only=True)
    class Meta:
        model = ExamTable
        fields = '__all__'
