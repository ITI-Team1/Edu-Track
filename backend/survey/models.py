from django.db import models
from user.models import User
from lecture.models import Lecture

# Create your models here.
class SurveyQuestion(models.Model):
    text = models.CharField(max_length=255)
    
    def __str__(self):
        return self.text

ratings = [("ممتاز", "ممتاز"), ("جيد جدا", "جيد جدا"), ("جيد", "جيد"), ("مقبول", "مقبول"), ("ضعيف", "ضعيف")]

class SurveyAnswer(models.Model):
    lecture = models.ForeignKey(Lecture, on_delete=models.CASCADE, related_name="survey_answers")
    question = models.ForeignKey(SurveyQuestion, on_delete=models.CASCADE, related_name="survey_answers")
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name="survey_answers")
    rating = models.CharField(choices=ratings) 

    class Meta:
        unique_together = ('lecture', 'question', 'student')

