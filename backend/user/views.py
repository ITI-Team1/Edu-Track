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




import os
import pandas as pd
from django.conf import settings
from django.core.files.storage import default_storage
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from django.db.models import Q
from django.db import transaction

from .models import User, University, Faculty, Program

class UploadExcelView(APIView):
    def post(self, request):
        file = request.FILES.get("file")
        if not file:
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)

        file_path = default_storage.save("tmp/" + file.name, file)
        full_path = os.path.join(settings.MEDIA_ROOT, file_path)

        try:
            df = pd.read_excel(full_path, sheet_name="Sheet1", dtype={'رقم الهاتف': str})
            
            # Use 'national_id' as a unique key for processing
            df['national_id'] = df.get("الرقم القومي", pd.Series()).astype(str)

            # --- 1. Pre-fetch related objects into dictionaries for fast lookups ---
            university = University.objects.first()
            if not university:
                return Response({"error": "No university found."}, status=status.HTTP_404_NOT_FOUND)

            try:
                group = Group.objects.get(id=2)
            except Group.DoesNotExist:
                group = Group.objects.create(id=2, name="Students")

            # Create dictionaries for fast in-memory lookups
            all_faculties = {f.name.lower(): f for f in Faculty.objects.filter(university=university)}
            all_programs = {p.name.lower(): p for p in Program.objects.filter(faculty__university=university)}

            # --- 2. Vectorized Data Cleaning and Transformation with Pandas ---
            df['english_name'] = df.get("الاسم بالانجليزي", pd.Series()).fillna('')
            df['first_name'] = df['english_name'].str.split(n=1, expand=True)[0]
            df['last_name'] = df['english_name'].str.split(n=1, expand=True)[1].fillna('')
            df['religion'] = df.get("الديانة", pd.Series()).astype(str).map({"1": "مسلم"}).fillna("مسيحي")
            df['maritalstatus'] = df.get("الحالة الاجتماعية", pd.Series()).astype(str).map({"1": "متزوج"}).fillna("أعزب")
            df['gender'] = df.get("النوع", pd.Series()).astype(str).map({"1": "ذكر"}).fillna("أنثى")

            # Use vectorized lookups for faculty and program
            df['faculty_name_lower'] = df.get("الكلية", pd.Series()).astype(str).str.strip().str.lower()
            df['program_name_lower'] = df.get("القسم", pd.Series()).astype(str).str.strip().str.lower()
            
            df['faculty_obj'] = df['faculty_name_lower'].map(all_faculties)
            df['program_obj'] = df['program_name_lower'].map(all_programs)
            
            unmatched_faculties = set(df[df['faculty_obj'].isna()]['الكلية'].unique())
            unmatched_programs = set(df[df['program_obj'].isna()]['القسم'].unique())
            
            # Map level choices
            level_map = {
                "1": "المستوى الأول", "2": "المستوى الثاني", "3": "المستوى الثالث",
                "4": "المستوى الرابع", "5": "المستوى الخامس", "6": "المستوى السادس",
                "7": "المستوى السابع",
            }
            df['level_raw'] = df.get("المستوى", df.get("المستوي", pd.Series())).astype(str)
            df['level'] = df['level_raw'].apply(lambda x: level_map.get(x) if x in level_map else None)

            # --- 3. Process Users in Batches ---
            existing_users_national_ids = set(User.objects.filter(
                nationalid__in=df['national_id'].tolist()).values_list('nationalid', flat=True)
            )

            users_to_create = []
            users_to_update = []
            created_count = 0
            
            for _, row in df.iterrows():
                defaults = {
                    "first_name": row['first_name'],
                    "last_name": row['last_name'],
                    "email": row['national_id'],
                    "username": row['national_id'],
                    "englishfullname": row['english_name'] or None,
                    "address": row.get("العنوان") or None,
                    "phonenumber": str(row.get("رقم الهاتف")) if row.get("رقم الهاتف") else None,
                    "placeofbirth": row.get("محل الميلاد") or None,
                    "nationality": row.get("الجنسية") or None,
                    "nationalid": row['national_id'],
                    "zipcode": str(row.get("الرمز البريدي")) if row.get("الرمز البريدي") else None,
                    "gender": row['gender'],
                    "maritalstatus": row['maritalstatus'],
                    "religion": row['religion'],
                    "level": row['level'],
                    "faculty": row['faculty_obj'],
                    "program": row['program_obj'],
                    "university": university,
                }
               
                if row['national_id'] not in existing_users_national_ids:
                    user = User(**defaults)
                    user.set_password(row['national_id'])
                    users_to_create.append(user)
                    created_count += 1
                else:
                    user = User.objects.get(nationalid=row['national_id'])
                    for key, value in defaults.items():
                        setattr(user, key, value)
                    user.set_password(row['national_id'])
                    users_to_update.append(user)

            with transaction.atomic():
                # Bulk create new users
                User.objects.bulk_create(users_to_create)

                # Bulk update existing users
                if users_to_update:
                    User.objects.bulk_update(users_to_update, [
                        "first_name", "last_name", "email", "username", "englishfullname",
                        "address", "phonenumber", "placeofbirth", "nationality", "zipcode",
                        "gender", "maritalstatus", "religion", "level", "faculty",
                        "program", "university", "password", "nationalid"  # Password is also updatable
                    ])

            # --- 4. Bulk Group Assignment ---
            all_processed_users = User.objects.filter(nationalid__in=df['national_id'].tolist())
            
            # Remove all users from any existing groups first, then add to group 2
            for user in all_processed_users:
                user.groups.clear()
                user.groups.add(group)
            # Prepare response
            response_data = {
                "success": "تم استيراد المستخدمين بنجاح",
                "processed": len(df),
                "created": created_count,
                "updated": len(df) - created_count
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
            if os.path.exists(full_path):
                os.remove(full_path)