from rest_framework import serializers
from .models import Lecture
from user.models import User


class SimpleUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "first_name", "last_name")

class LectureSerializer(serializers.ModelSerializer):
    # Read-only projection for instructors to get names without extra queries from the client
    instructor_details = SimpleUserSerializer(source='instructor', many=True, read_only=True)
    class Meta:
        model = Lecture
        fields = '__all__'

    def validate(self, data):
        pk = self.instance.pk if self.instance else None 
        # With ManyToMany, 'instructor' may be a queryset/list or absent on update
        instructors = data.get('instructor')
        if instructors is None and self.instance is not None:
            instructors = self.instance.instructor.all()
        location = data.get('location')
        day = data.get('day')
        start = data.get('starttime')
        end = data.get('endtime')
        # Validate instructor time conflicts: any of the given instructors cannot overlap
        if instructors:
            if Lecture.objects.filter(
                instructor__in=instructors,
                day=day,
                starttime__lt=end,
                endtime__gt=start
            ).exclude(pk=pk).exists():
                raise serializers.ValidationError("One or more instructors have another lecture at this time.")
        if Lecture.objects.filter(location=location, day=day, starttime__lt=end, endtime__gt=start).exclude(pk=pk).exists():
            raise serializers.ValidationError("Location is occupied at this time.")
        return data

class EnrollStudentSerializer(serializers.Serializer):
    studentid = serializers.IntegerField()
    courseids = serializers.ListField(child=serializers.IntegerField(), allow_empty=False)
