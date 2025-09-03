from rest_framework.serializers import ModelSerializer
from .models import User
from django.contrib.auth.models import Group
from django.contrib.admin.models import LogEntry

class UserSerializer(ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id", "username", "first_name", "last_name", "email", "englishfullname", "address", "religion", "picture", 
            "phonenumber", "birthday", "placeofbirth", "nationalid", "nationality", "zipcode", 
            "gender", "maritalstatus", "groups", "program", "faculty", "university"
        )


class GroupSerializer(ModelSerializer):
    class Meta:
        model = Group
        fields = ["id", "name", "permissions"]
        depth = 1   
        
class LogSerializer(ModelSerializer):
    class Meta:
        model = LogEntry
        fields = ["id", "action_time", "user", "content_type", "object_repr", "change_message", "action_flag"]
        depth = 1