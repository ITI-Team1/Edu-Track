from rest_framework.generics import ListAPIView, CreateAPIView, RetrieveAPIView, DestroyAPIView, UpdateAPIView
from .models import ExamTable
from .serializers import ExamTableSerializer
from user.permissions import GroupPermission

# Create your views here.
class ListLecture(ListAPIView):
    queryset =  ExamTable.objects.all()
    serializer_class = ExamTableSerializer
    permission_classes = [type('CustomPerm',(GroupPermission,),{'required_permission': 'exam.view_examtable'})]


class CreateLecture(CreateAPIView):
    queryset =  ExamTable.objects.all()
    serializer_class = ExamTableSerializer
    permission_classes = [type('CustomPerm',(GroupPermission,),{'required_permission': 'exam.add_examtable'})]

class RetrieveLecture(RetrieveAPIView):
    queryset =  ExamTable.objects.all()
    serializer_class = ExamTableSerializer
    permission_classes = [type('CustomPerm',(GroupPermission,),{'required_permission': 'exam.view_examtable'})]


class UpdateLecture(UpdateAPIView):
    queryset =  ExamTable.objects.all()
    serializer_class = ExamTableSerializer
    permission_classes = [type('CustomPerm',(GroupPermission,),{'required_permission': 'exam.change_examtable'})]


class DestoryLecture(DestroyAPIView):
    queryset =  ExamTable.objects.all()
    serializer_class = ExamTableSerializer
    permission_classes = [type('CustomPerm',(GroupPermission,),{'required_permission': 'exam.delete_examtable'})]

