from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group

User = get_user_model()

class Command(BaseCommand):
    help = 'Assign a user to instructor or student group'

    def add_arguments(self, parser):
        parser.add_argument('username', type=str, help='Username to assign to group')
        parser.add_argument('group', type=str, choices=['instructor', 'student'], help='Group to assign user to')

    def handle(self, *args, **options):
        username = options['username']
        group_type = options['group']
        
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'User {username} does not exist')
            )
            return
        
        group_name = 'Instructors' if group_type == 'instructor' else 'Students'
        
        try:
            group = Group.objects.get(name=group_name)
        except Group.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'Group {group_name} does not exist. Run setup_attendance_permissions first.')
            )
            return
        
        # Remove from other group first
        other_group_name = 'Students' if group_type == 'instructor' else 'Instructors'
        try:
            other_group = Group.objects.get(name=other_group_name)
            user.groups.remove(other_group)
        except Group.DoesNotExist:
            pass
        
        user.groups.add(group)
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully added {username} to {group_name} group')
        )
