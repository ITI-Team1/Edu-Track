from rest_framework.generics import ListAPIView, CreateAPIView, RetrieveAPIView, DestroyAPIView, UpdateAPIView
from rest_framework.views import APIView
from .models import Lecture
from .serializers import LectureSerializer, EnrollStudentSerializer
from user.permissions import GroupPermission
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from user.models import User
from attendance.models import StudentMark

# Create your views here.
class ListLecture(ListAPIView):
    queryset =  Lecture.objects.all()
    serializer_class = LectureSerializer
    permission_classes = [type('CustomPerm',(GroupPermission,),{'required_permission': 'lecture.view_lecture'})]


class CreateLecture(CreateAPIView):
    queryset =  Lecture.objects.all()
    serializer_class = LectureSerializer
    permission_classes = [type('CustomPerm',(GroupPermission,),{'required_permission': 'lecture.add_lecture'})]

class RetrieveLecture(RetrieveAPIView):
    queryset =  Lecture.objects.all()
    serializer_class = LectureSerializer
    permission_classes = [type('CustomPerm',(GroupPermission,),{'required_permission': 'lecture.view_lecture'})]


class UpdateLecture(UpdateAPIView):
    queryset =  Lecture.objects.all()
    serializer_class = LectureSerializer
    permission_classes = [type('CustomPerm',(GroupPermission,),{'required_permission': 'lecture.change_lecture'})]


class DestoryLecture(DestroyAPIView):
    queryset =  Lecture.objects.all()
    serializer_class = LectureSerializer
    permission_classes = [type('CustomPerm',(GroupPermission,),{'required_permission': 'lecture.delete_lecture'})]



class EnrollStudentInCourses(APIView):
    def post(self, request):
        serializer = EnrollStudentSerializer(data=request.data)
        if serializer.is_valid():
            studentid = serializer.validated_data['studentid']
            courseids = serializer.validated_data['courseids']
            student = get_object_or_404(User, id=studentid)
            lectures = Lecture.objects.filter(course__in=courseids)
            if not lectures.exists():
                return Response({"detail": "No lectures found for the given courses."}, status=status.HTTP_404_NOT_FOUND)
            for lecture in lectures:
                lecture.students.add(student)

                StudentMark.objects.create(student=student, lecture=lecture,
                    defaults={"attendance_mark": 0.0, "instructor_mark": 0.0, "final_mark": 0.0})

            return Response({"student": student.username, "enrolled lectures": [str(lec) for lec in lectures]}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
