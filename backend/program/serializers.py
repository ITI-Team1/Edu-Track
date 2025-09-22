from rest_framework.serializers import ModelSerializer
from .models import Program
from faculty.serializers import FacultySerializer
class ProgramSerializer(ModelSerializer):
    
    faculty = FacultySerializer(  read_only=True)
    class Meta:
        model = Program
        fields = '__all__'
        depth = 1