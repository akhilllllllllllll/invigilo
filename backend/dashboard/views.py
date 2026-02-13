from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth import authenticate, get_user_model
from rest_framework import status
from .models import Teacher, ExamHall, ExamSchedule
from .serializers import TeacherSerializer, ExamHallSerializer, ExamScheduleSerializer
from .ocr_utils import extract_text_from_image

import random
from datetime import datetime, timedelta
import re
from PIL import Image
from io import BytesIO   # ✅ fix for Unsupported image object

User = get_user_model()  # ✅ Use custom User model


class TeacherViewSet(viewsets.ModelViewSet):
    queryset = Teacher.objects.all()
    serializer_class = TeacherSerializer


class ExamHallViewSet(viewsets.ModelViewSet):
    queryset = ExamHall.objects.all()
    serializer_class = ExamHallSerializer


# NEW: schedules CRUD for /api/examschedules/
class ExamScheduleViewSet(viewsets.ModelViewSet):
    queryset = ExamSchedule.objects.all().order_by("-created_at")
    serializer_class = ExamScheduleSerializer


assignments = []


@api_view(['POST'])
def assign_teacher(request):
    if request.data.get('random'):
        all_teachers = list(Teacher.objects.all())
        all_halls = list(ExamHall.objects.all())

        random.shuffle(all_teachers)
        random.shuffle(all_halls)

        assignments.clear()

        for t, h in zip(all_teachers, all_halls):
            assignments.append({
                'teacher_name': t.user.username,
                'subject': t.subject,
                'hall_name': h.hall_id
            })

        return Response({'message': 'Auto-assignment successful'})

    teacher_id = request.data.get('teacher_id')
    hall_id = request.data.get('hall_id')
    try:
        teacher = Teacher.objects.get(id=teacher_id)
        classroom = ExamHall.objects.get(id=hall_id)

        assignments.append({
            'teacher_name': teacher.user.username,
            'subject': teacher.subject,
            'hall_name': classroom.hall_id
        })

        return Response({'message': 'Assigned successfully!'})
    except:
        return Response({'error': 'Invalid ID'}, status=400)


@api_view(['GET'])
def get_assignments(request):
    return Response(assignments)


class TeacherSignupView(APIView):
    def post(self, request):
        try:
            username = request.data.get('username')
            password = request.data.get('password')
            email = request.data.get('email')
            subject = request.data.get('subject')
            name = request.data.get('name')

            if not all([username, password, email, subject, name]):
                return Response({'error': 'Missing required fields'}, status=400)

            if User.objects.filter(username=username).exists():
                return Response({'error': 'Username already exists'}, status=400)

            # ✅ Create user with custom model
            user = User.objects.create_user(
                username=username,
                password=password,
                email=email,
                first_name=name,
                is_teacher=True
            )
            Teacher.objects.create(user=user, subject=subject)

            return Response({'message': 'Teacher registered successfully'}, status=201)

        except Exception as e:
            return Response({'error': str(e)}, status=500)


class LoginView(APIView):
    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        role = request.data.get("role")  # ⬅️ Added role check ("Admin" or "Teacher")

        if not username or not password or not role:
            return Response({"error": "Missing fields"}, status=status.HTTP_400_BAD_REQUEST)

        # 🔹 Admin Login
        if role == "Admin":
            user = authenticate(username=username, password=password)
            if user and user.is_superuser:
                return Response({
                    "message": "Admin login successful",
                    "role": "Admin",
                    "user_id": user.id
                }, status=200)
            return Response({"error": "Invalid admin credentials"}, status=401)

        # 🔹 Teacher Login
        elif role == "Teacher":
            teacher = Teacher.objects.filter(user__username=username).first()
            if teacher and teacher.user.check_password(password):
                return Response({
                    "message": "Teacher login successful",
                    "role": "Teacher",
                    "teacher_id": teacher.id,
                    "name": teacher.user.first_name,
                    "subject": teacher.subject,
                }, status=200)
            return Response({"error": "Invalid teacher credentials"}, status=401)

        return Response({"error": "Invalid role"}, status=400)


# 📌 Your existing OCR endpoint (kept, but fixed)
class TimetableUploadView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, *args, **kwargs):
        file_obj = request.FILES.get("file")
        if not file_obj:
            return Response({"error": "No file uploaded"}, status=400)

        try:
            # ✅ Fix: ensure BytesIO for PIL
            image = Image.open(BytesIO(file_obj.read()))
            text = extract_text_from_image(image)

            return Response({
                "message": "Timetable processed successfully",
                "extracted_text": text
            }, status=200)
        except Exception as e:
            return Response({"error": str(e)}, status=500)


# -----------------------
# NEW endpoints to match your React page
# -----------------------

# 1) /api/ocr-upload/  -> returns { items: [...] } for "pending" table
class OCRUploadView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, *args, **kwargs):
        file = request.FILES.get("file")
        if not file:
            return Response({"error": "No file uploaded"}, status=400)

        try:
            # ✅ Ensure OCR works with BytesIO
            image = Image.open(BytesIO(file.read()))
            text = extract_text_from_image(image)

            items = []

            # Pattern A: "12-Feb: Math - 10AM Hall A"
            pat_a = re.compile(
                r"(?P<day>\d{1,2})-(?P<mon>[A-Za-z]{3})\s*:\s*(?P<subject>[A-Za-z0-9 &._-]+)\s*-\s*(?P<time>\d{1,2}(:\d{2})?\s*(AM|PM))\s*(?P<hall>Hall\s+[A-Za-z0-9-]+)?",
                re.IGNORECASE
            )

            # Pattern B: "Math Hall-A203 2025-08-17 09:00 12:00"
            pat_b = re.compile(
                r"(?P<subject>[A-Za-z0-9 &._-]+)\s+(?P<hall>Hall[-\s]?[A-Za-z0-9-]+)?\s+(?P<date>\d{4}-\d{2}-\d{2})\s+(?P<start>\d{2}:\d{2})\s+(?P<end>\d{2}:\d{2})",
                re.IGNORECASE
            )

            # ✅ NEW Pattern C: "Math 17-08-2025 09:00 12:00 Hall A-203"
            pat_c = re.compile(
                r"(?P<subject>[A-Za-z0-9 &._-]+)\s+"
                r"(?P<day>\d{2})-(?P<mon>\d{2})-(?P<year>\d{4})\s+"
                r"(?P<start>\d{2}:\d{2})\s+(?P<end>\d{2}:\d{2})\s+"
                r"(?P<hall>Hall\s*[A-Za-z0-9-]+)",
                re.IGNORECASE
            )

            month_map = {
                'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
                'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
            }
            current_year = datetime.now().year

            for raw_line in text.splitlines():
                line = raw_line.strip()
                if not line:
                    continue

                m = pat_b.match(line)
                if m:
                    subj = m.group('subject').strip()
                    hall = (m.group('hall') or '').strip() or None
                    date = m.group('date')
                    start = m.group('start')
                    end = m.group('end')
                    start_iso = f"{date}T{start}:00"
                    end_iso = f"{date}T{end}:00"
                    items.append({
                        "subject": subj,
                        "hall_name": hall,
                        "start_datetime": start_iso,
                        "end_datetime": end_iso
                    })
                    continue

                m = pat_a.match(line)
                if m:
                    day = int(m.group('day'))
                    mon = m.group('mon').title()
                    subj = m.group('subject').strip()
                    time_str = m.group('time').replace(' ', '').upper()
                    hall = (m.group('hall') or '').strip() or None

                    # Parse 10AM / 1:30PM etc.
                    t = datetime.strptime(time_str, "%I%p") if ':' not in time_str else datetime.strptime(time_str, "%I:%M%p")
                    start_dt = datetime(current_year, month_map.get(mon, 1), day, t.hour, t.minute)
                    # assume 3 hours if end not given
                    end_dt = start_dt + timedelta(hours=3)

                    items.append({
                        "subject": subj,
                        "hall_name": hall,
                        "start_datetime": start_dt.strftime("%Y-%m-%dT%H:%M:%S"),
                        "end_datetime": end_dt.strftime("%Y-%m-%dT%H:%M:%S")
                    })
                    continue

                m = pat_c.match(line)
                if m:
                    subj = m.group('subject').strip()
                    hall = m.group('hall').strip()
                    date = f"{m.group('year')}-{m.group('mon')}-{m.group('day')}"
                    start_iso = f"{date}T{m.group('start')}:00"
                    end_iso = f"{date}T{m.group('end')}:00"
                    items.append({
                        "subject": subj,
                        "hall_name": hall,
                        "start_datetime": start_iso,
                        "end_datetime": end_iso
                    })
                    continue

            return Response({"items": items, "extracted_text": text}, status=200)
        except Exception as e:
            return Response({"error": str(e)}, status=500)


# 2) /api/examschedules/bulk_create/  -> saves the pending items to DB
@api_view(["POST"])
def bulk_create_schedules(request):
    items = request.data.get("items", [])
    if not isinstance(items, list):
        return Response({"error": "items must be a list"}, status=400)

    created = []
    errors = []

    for i, item in enumerate(items, start=1):
        payload = {
            "subject": item.get("subject"),
            "start_datetime": item.get("start_datetime"),
            "end_datetime": item.get("end_datetime"),
            "hall_name_in": item.get("hall_name"),
        }
        ser = ExamScheduleSerializer(data=payload)
        if ser.is_valid():
            ser.save()
            created.append(ser.data)
        else:
            errors.append({"index": i, "errors": ser.errors})

    status_code = 201 if not errors else 207  # 207: multi-status
    return Response({"created": created, "errors": errors}, status=status_code)
