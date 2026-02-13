from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings

# -------------------------------
# Custom User model
# -------------------------------
class User(AbstractUser):
    is_teacher = models.BooleanField(default=False)

    def __str__(self):
        return self.get_full_name() or self.username


# -------------------------------
# Teacher model linked to User
# -------------------------------
class Teacher(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="teacher_profile",
        null=True,   # ✅ Allows existing data not to break
        blank=True   # ✅ Lets forms skip this during development
    )
    subject = models.CharField(max_length=100)

    def __str__(self):
        if self.user:
            return f"{self.user.get_full_name()} ({self.subject})"
        return f"Unlinked Teacher ({self.subject})"


# -------------------------------
# Exam Hall model
# -------------------------------
class ExamHall(models.Model):
    hall_id = models.CharField(max_length=20, unique=True)
    capacity = models.IntegerField()

    def __str__(self):
        return self.hall_id


# -------------------------------
# Exam Schedule model (your existing one)
# -------------------------------
class ExamSchedule(models.Model):
    subject = models.CharField(max_length=200)
    hall = models.ForeignKey(
        ExamHall, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def hall_name(self):
        return self.hall.hall_id if self.hall else None

    def __str__(self):
        return f"{self.subject} ({self.start_datetime})"
