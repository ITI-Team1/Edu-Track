from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from attendance.models import Attendance, StudentAttendance

class Command(BaseCommand):
    help = 'Setup attendance permissions and groups for testing'

    def handle(self, *args, **options):
        # Get or create groups
        instructor_group, created = Group.objects.get_or_create(name='Instructors')
        student_group, created = Group.objects.get_or_create(name='Students')
        
        # Get content types
        attendance_ct = ContentType.objects.get_for_model(Attendance)
        student_attendance_ct = ContentType.objects.get_for_model(StudentAttendance)
        
        # Get permissions
        attendance_perms = Permission.objects.filter(content_type=attendance_ct)
        student_attendance_perms = Permission.objects.filter(content_type=student_attendance_ct)
        
        # Assign all attendance permissions to instructors
        for perm in attendance_perms:
            instructor_group.permissions.add(perm)
            
        for perm in student_attendance_perms:
            instructor_group.permissions.add(perm)
        
        # Students only need to view and change their own attendance
        student_perms = [
            'view_studentattendance',
            'change_studentattendance'
        ]
        
        for perm_name in student_perms:
            try:
                perm = Permission.objects.get(
                    codename=perm_name,
                    content_type=student_attendance_ct
                )
                student_group.permissions.add(perm)
            except Permission.DoesNotExist:
                self.stdout.write(
                    self.style.WARNING(f'Permission {perm_name} not found')
                )
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully setup groups and permissions')
        )
        
        self.stdout.write(f'Instructor permissions: {list(instructor_group.permissions.values_list("codename", flat=True))}')
        self.stdout.write(f'Student permissions: {list(student_group.permissions.values_list("codename", flat=True))}')
