from rest_framework import generics
from django.contrib.auth.models import Group
from .serializers import GroupSerializer, LogSerializer
from django.contrib.admin.models import LogEntry
from rest_framework.response import Response
from rest_framework import status
from django.core.files.storage import default_storage
from user.models import User
from rest_framework import permissions
from rest_framework.views import APIView
from university.models import University
from faculty.models import Faculty
from program.models import Program
import os   
import pandas as pd
from django.conf import settings

# Create your views here.
class GroupList(generics.ListAPIView):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer

class LogList(generics.ListAPIView):
    queryset = LogEntry.objects.all().order_by("-action_time")
    serializer_class = LogSerializer

import os
import random
import pandas as pd
from django.conf import settings
from django.core.files.storage import default_storage
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import User, Faculty, Program, University


class UploadExcelView(APIView):
    def post(self, request):
        file = request.FILES.get("file")
        if not file:
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)

        # Save file temporarily
        file_path = default_storage.save("tmp/" + file.name, file)
        full_path = os.path.join(settings.MEDIA_ROOT, file_path)

        try:
            # Read Excel
            df = pd.read_excel(full_path, sheet_name="Sheet1")

            university = University.objects.first()  # optional, can be None
            for _, row in df.iterrows():
                
                english_name = row.get("الاسم بالانجليزي", "")
                national_id = str(row.get("الرقم القومي", ""))

                # Username = national id
              
                username = national_id

                # Password = full national id
                password = national_id

                # First name = english name
                first_name = english_name.split()[0]

                # Last name = english name
                last_name = english_name.split()[1]

                religion = "مسلم" if row.get("الديانة", "") == "1" else "مسيحي"
                maritalstatus = "متزوج" if row.get("الحالة الاجتماعية", "") == "1" else "أعزب"
                gender = "ذكر" if row.get("النوع", "") == "1" else "أنثى"

                # Faculty
                faculty = None
                faculty_name = row.get("الكلية")
                if faculty_name and university:
                    try:
                        faculty = Faculty.objects.get(name=faculty_name, university=university)
                    except Faculty.DoesNotExist:
                        faculty = None

                # Program
                program = None
                program_name = row.get("القسم")
                if program_name and faculty:
                    try:
                        program = Program.objects.get(name=program_name, faculty=faculty)
                    except Program.DoesNotExist:
                        program = None

                # Level (optional): read and normalize to allowed choices
                level_raw = row.get("المستوى") or row.get("المستوي") or row.get("level") or row.get("Level")
                level = None
                if level_raw is not None:
                    val = str(level_raw).strip()
                    level_map = {
                        "1": "المستوى الأول",
                        "2": "المستوى الثاني",
                        "3": "المستوى الثالث",
                        "4": "المستوى الرابع",
                        "5": "المستوى الخامس",
                        "6": "المستوى السادس",
                        "7": "المستوى السابع",
                        
                    }
                    if val in level_map:
                        level = level_map[val]
                    elif val in level_map.values():
                        level = val

                # Create / update user
                user, created = User.objects.update_or_create(
                    nationalid=national_id,
                    defaults={
                        "first_name": first_name,
                        "last_name": last_name,
                        "email": national_id,
                        "username": username,
                        "englishfullname": english_name or None,
                        "address": row.get("العنوان") or None,
                        "phonenumber": str(row.get("رقم الهاتف")) if row.get("رقم الهاتف") else None,
                        "placeofbirth": row.get("محل الميلاد") or None,
                        "nationality": row.get("الجنسية") or None,
                        "zipcode": str(row.get("الرمز البريدي")) if row.get("الرمز البريدي") else None,
                        "gender": gender,
                        "maritalstatus": maritalstatus,
                        "religion": religion,
                        "level": level,
                        "faculty": faculty,
                        "program": program,
                        "university": university,
                    },
                )
                user.set_password(password)
                user.save()

            return Response({"success": "Users imported successfully"}, status=status.HTTP_201_CREATED)

        finally:
            # Always delete the file after processing
            if os.path.exists(full_path):
                os.remove(full_path)
