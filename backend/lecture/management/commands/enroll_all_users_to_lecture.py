from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from lecture.models import Lecture
from user.models import User
from attendance.models import Attendance, StudentAttendance
from django.utils import timezone

class Command(BaseCommand):
    help = "Enroll all users into a given lecture's students M2M. Optionally create an Attendance and StudentAttendance skeletons."

    def add_arguments(self, parser):
        parser.add_argument('lecture_id', type=int, help='Lecture ID to enroll into')
        parser.add_argument('--with-attendance', action='store_true', help='Also create an Attendance now and bootstrap StudentAttendance rows (present=False)')

    @transaction.atomic
    def handle(self, *args, **options):
        lecture_id = options['lecture_id']
        with_attendance = options['with_attendance']
        try:
            lecture = Lecture.objects.select_for_update().get(pk=lecture_id)
        except Lecture.DoesNotExist:
            raise CommandError(f'Lecture {lecture_id} does not exist')

        users = list(User.objects.all())
        if not users:
            self.stdout.write(self.style.WARNING('No users found to enroll.'))
            return

        lecture.students.add(*users)
        self.stdout.write(self.style.SUCCESS(f'Enrolled {len(users)} users into Lecture {lecture_id}.'))

        if with_attendance:
            # Create an Attendance at current time (will validate time/day in clean)
            att = Attendance(lecture=lecture)
            # Bypass clean constraints only if valid; otherwise warn and skip creation
            try:
                att.full_clean()
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'Could not create Attendance now due to validation: {e}'))
            else:
                att.save()
                # Create StudentAttendance rows (present stays False)
                created = 0
                for u in users:
                    StudentAttendance.objects.get_or_create(attendance=att, student=u)
                    created += 1
                self.stdout.write(self.style.SUCCESS(f'Created Attendance {att.id} and {created} StudentAttendance rows.'))
