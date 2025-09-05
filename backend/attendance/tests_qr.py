from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from lecture.models import Lecture
from course.models import Course
from faculty.models import Faculty
from location.models import Location
from university.models import University
from program.models import Program
from attendance.models import Attendance, AttendanceQRSession, StudentAttendance
from datetime import time, timedelta

User = get_user_model()

class QRAttendanceTest(APITestCase):
    def setUp(self):
        self.university = University.objects.create(name='TestU', slug='testu', logo='test.png')
        self.faculty = Faculty.objects.create(name='TestF', slug='testf', university=self.university, logo='test.png')
        self.program = Program.objects.create(name='TestProgram', slug='testprogram', faculty=self.faculty)
        self.location = Location.objects.create(name='Room1', slug='room1', capacity=50)
        self.location.faculties.add(self.faculty)
        self.instructor = User.objects.create_user(username='instr', password='pass')
        self.student = User.objects.create_user(username='stud', password='pass')
        # Minimal course stub
        self.course = Course.objects.create(title='Course1', slug='course1')
        self.course.programs.add(self.program)
        self.lecture = Lecture.objects.create(course=self.course, instructor=self.instructor, location=self.location, day='السبت', starttime=time(0,0), endtime=time(23,59))
        self.lecture.students.add(self.student)
        self.attendance = Attendance.objects.create(lecture=self.lecture)
        self.student_attendance, _ = StudentAttendance.objects.get_or_create(attendance=self.attendance, student=self.student)

    def auth(self, user):
        self.client.force_authenticate(user)

    def test_rotate_and_mark(self):
        self.auth(self.instructor)
        url_rotate = reverse('Attendance-generate-qr', args=[self.attendance.id])
        r = self.client.post(url_rotate)
        self.assertEqual(r.status_code, 201)
        token = r.data['token']
        self.auth(self.student)
        update_url = reverse('StudentAttendance-update', args=[self.student_attendance.id])
        # Provide Egypt IP inside a known range
        with self.settings():
            r2 = self.client.patch(update_url, { 'token': token, 'ip': '41.32.10.10' }, format='json')
        self.assertEqual(r2.status_code, 200)
        self.student_attendance.refresh_from_db()
        self.assertTrue(self.student_attendance.present)

    def test_expired_token_rejected(self):
        # Create expired session
        AttendanceQRSession.objects.create(attendance=self.attendance, token='abc', created_at=timezone.now()-timedelta(seconds=20), expires_at=timezone.now()-timedelta(seconds=10))
        self.auth(self.student)
        update_url = reverse('StudentAttendance-update', args=[self.student_attendance.id])
        r = self.client.patch(update_url, { 'token': 'abc', 'ip': '41.32.10.10' }, format='json')
        self.assertEqual(r.status_code, 400)
