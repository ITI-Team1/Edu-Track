import os   
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
import pandas as pd
from django.conf import settings
from django.core.files.storage import default_storage
from .models import User, Faculty, Program, University



# Create your views here.
class GroupList(generics.ListAPIView):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer

class LogList(generics.ListAPIView):
    queryset = LogEntry.objects.all().order_by("-action_time")
    serializer_class = LogSerializer




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
            
            # Get the group with ID 2 (or create it if it doesn't exist)
            try:
                group = Group.objects.get(id=2)
            except Group.DoesNotExist:
                # Create a default group if it doesn't exist
                group = Group.objects.create(id=2, name="Students")
            
            unmatched_faculties = set()
            unmatched_programs = set()
            processed_count = 0
            created_count = 0
            
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

                # Faculty - improved matching with case-insensitive search
                faculty = None
                faculty_name = row.get("الكلية")
                if faculty_name and university:
                    faculty_name = str(faculty_name).strip()
                    try:
                        # Try exact match first
                        faculty = Faculty.objects.get(name=faculty_name, university=university)
                    except Faculty.DoesNotExist:
                        try:
                            # Try case-insensitive match
                            faculty = Faculty.objects.get(name__iexact=faculty_name, university=university)
                        except Faculty.DoesNotExist:
                            try:
                                # Try partial match (contains)
                                faculty = Faculty.objects.filter(name__icontains=faculty_name, university=university).first()
                            except:
                                faculty = None
                                if university:
                                    unmatched_faculties.add(faculty_name)
                                    print(f"Warning: Faculty '{faculty_name}' not found for university '{university.name}'")

                # Program - improved matching with case-insensitive search
                program = None
                program_name = row.get("القسم")
                if program_name and faculty:
                    program_name = str(program_name).strip()
                    try:
                        # Try exact match first
                        program = Program.objects.get(name=program_name, faculty=faculty)
                    except Program.DoesNotExist:
                        try:
                            # Try case-insensitive match
                            program = Program.objects.get(name__iexact=program_name, faculty=faculty)
                        except Program.DoesNotExist:
                            try:
                                # Try partial match (contains)
                                program = Program.objects.filter(name__icontains=program_name, faculty=faculty).first()
                            except:
                                program = None
                                if faculty:
                                    unmatched_programs.add(program_name)
                                    print(f"Warning: Program '{program_name}' not found for faculty '{faculty.name}'")
                
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
                
                # Add user to group 2
                user.groups.add(group)
                
                processed_count += 1
                if created:
                    created_count += 1

            # Prepare response with detailed statistics
            response_data = {
                "success": "Users imported successfully",
                "processed": processed_count,
                "created": created_count,
                "updated": processed_count - created_count
            }
            
            if unmatched_faculties:
                response_data["unmatched_faculties"] = list(unmatched_faculties)
                response_data["warnings"] = f"Found {len(unmatched_faculties)} unmatched faculty names"
                
            if unmatched_programs:
                response_data["unmatched_programs"] = list(unmatched_programs)
                if "warnings" in response_data:
                    response_data["warnings"] += f" and {len(unmatched_programs)} unmatched program names"
                else:
                    response_data["warnings"] = f"Found {len(unmatched_programs)} unmatched program names"

            return Response(response_data, status=status.HTTP_201_CREATED)

        finally:
            # Always delete the file after processing
            if os.path.exists(full_path):
                os.remove(full_path)