from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TeacherViewSet,
    ExamHallViewSet,
    # NEW
    ExamScheduleViewSet,
    OCRUploadView,
    bulk_create_schedules,

    assign_teacher,
    get_assignments,
    TeacherSignupView,
    LoginView,
    TimetableUploadView,   # keep your old endpoint working too
)

router = DefaultRouter()
router.register(r'teachers', TeacherViewSet)
router.register(r'halls', ExamHallViewSet)
# NEW: allow CRUD on schedules
router.register(r'examschedules', ExamScheduleViewSet)

urlpatterns = [
    # router endpoints:
    path('', include(router.urls)),                      # /api/teachers/, /api/halls/, /api/examschedules/

    # your existing custom endpoints:
    path('assign-teacher/', assign_teacher),             # /api/assign-teacher/ (manual + auto POST)
    path('assignments/', get_assignments),               # /api/assignments/ (GET)
    path('signup/', TeacherSignupView.as_view()),        # /api/signup/
    path('login/', LoginView.as_view()),                 # /api/login/
    path('upload-timetable/', TimetableUploadView.as_view(), name="upload-timetable"),  # old OCR endpoint (kept)

    # NEW endpoints your React page expects:
    path('ocr-upload/', OCRUploadView.as_view(), name='ocr-upload'),                        # POST image
    path('examschedules/bulk_create/', bulk_create_schedules, name='bulk-create-schedules') # POST items[]
]
