from rest_framework.serializers import ModelSerializer


from faculty.serializers import FacultySerializer
from program.serializers import ProgramSerializer
from .models import User
from django.contrib.auth.models import Group
from django.contrib.admin.models import LogEntry


class GroupSerializer(ModelSerializer):
    class Meta:
        model = Group
        fields = ["id", "name", "permissions"]
        depth = 1 


class UserSerializer(ModelSerializer):
    # use faculty serializer to show the data of it as all feilds
    faculty = FacultySerializer(  read_only=True)
    program = ProgramSerializer(  read_only=True)
    groups = GroupSerializer(many=True,  read_only=True)


    class Meta:
        

        model = User
        fields = (
            "id", "username", "first_name", "last_name", "email", "englishfullname", "address", "religion", "picture", 
            "phonenumber", "birthday", "placeofbirth", "nationalid", "nationality", "zipcode", 
            "gender", "maritalstatus", "level", "groups", "program", "faculty", "university", "lectures_attended"
        )


  
        
class LogSerializer(ModelSerializer):
    class Meta:
        model = LogEntry
        fields = ["id", "action_time", "user", "content_type", "object_repr", "change_message", "action_flag"]
        depth = 1