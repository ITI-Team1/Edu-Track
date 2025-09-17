from rest_framework.generics import ListAPIView, CreateAPIView, RetrieveAPIView, DestroyAPIView, UpdateAPIView
from .models import *
from .serializers import *
from user.permissions import GroupPermission

# Create your views here.
class ListSurveyQuestion(ListAPIView):
    queryset =  SurveyQuestion.objects.all()
    serializer_class = SurveyQuestionSerializer
    permission_classes = [type('CustomPerm',(GroupPermission,),{'required_permission': 'survey.view_surveyquestion'})]

class RetrieveSurveyQuestion(RetrieveAPIView):
    queryset =  SurveyQuestion.objects.all()
    serializer_class = SurveyQuestionSerializer
    permission_classes = [type('CustomPerm',(GroupPermission,),{'required_permission': 'survey.view_surveyquestion'})]

class ListSurveyAnswer(ListAPIView):
    queryset =  SurveyAnswer.objects.all()
    serializer_class = SurveyAnswerSerializer
    permission_classes = [type('CustomPerm',(GroupPermission,),{'required_permission': 'survey.view_surveyanswer'})]

class RetrieveSurveyAnswer(RetrieveAPIView):
    queryset =  SurveyAnswer.objects.all()
    serializer_class = SurveyAnswerSerializer
    permission_classes = [type('CustomPerm',(GroupPermission,),{'required_permission': 'survey.view_surveyanswer'})]

class CreateSurveyAnswer(CreateAPIView):
    queryset =  SurveyAnswer.objects.all()
    serializer_class = SurveyAnswerSerializer
    permission_classes = [type('CustomPerm',(GroupPermission,),{'required_permission': 'survey.add_surveyanswer'})]
