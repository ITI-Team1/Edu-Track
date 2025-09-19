from rest_framework.serializers import ModelSerializer
from .models import ExamTable

class ExamTableSerializer(ModelSerializer):

    class Meta:
        model = ExamTable
        fields = '__all__'
