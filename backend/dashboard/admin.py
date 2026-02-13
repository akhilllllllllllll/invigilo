from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Teacher, ExamHall, ExamSchedule

# Inline for Teacher attached to User
class TeacherInline(admin.StackedInline):
    model = Teacher
    can_delete = False
    verbose_name_plural = 'Teacher'
    fk_name = 'user'

# Custom User admin
class CustomUserAdmin(BaseUserAdmin):
    inlines = (TeacherInline,)
    list_display = ('username', 'email', 'is_teacher', 'is_staff', 'is_superuser')
    list_filter = ('is_teacher', 'is_staff', 'is_superuser')

# ✅ Register
admin.site.register(User, CustomUserAdmin)
admin.site.register(ExamHall)
admin.site.register(ExamSchedule)  # NEW
