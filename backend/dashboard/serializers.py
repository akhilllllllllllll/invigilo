from rest_framework import serializers
from .models import Teacher, ExamHall, User, ExamSchedule
from django.contrib.auth.hashers import make_password

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'first_name']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        validated_data['password'] = make_password(validated_data['password'])
        return super().create(validated_data)

class TeacherSerializer(serializers.ModelSerializer):
    user = UserSerializer()

    class Meta:
        model = Teacher
        fields = ['id', 'user', 'subject']

    def create(self, validated_data):
        user_data = validated_data.pop('user')
        user_data['is_teacher'] = True
        user = User.objects.create(**user_data)
        return Teacher.objects.create(user=user, **validated_data)

class ExamHallSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamHall
        fields = '__all__'

# NEW: ExamSchedule serializer that works with your model (FK hall) + frontend (hall_name)
class ExamScheduleSerializer(serializers.ModelSerializer):
    hall_name = serializers.SerializerMethodField(read_only=True)
    # allow frontend to POST hall_name directly
    hall_name_in = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)

    class Meta:
        model = ExamSchedule
        fields = ['id', 'subject', 'hall', 'hall_name', 'start_datetime', 'end_datetime', 'created_at', 'hall_name_in']
        read_only_fields = ['created_at']

    def get_hall_name(self, obj):
        return obj.hall.hall_id if obj.hall else None

    def create(self, validated_data):
        # map hall_name_in -> hall FK
        hall_name_in = validated_data.pop('hall_name_in', None)
        if hall_name_in:
            hall = ExamHall.objects.filter(hall_id=hall_name_in).first()
            validated_data['hall'] = hall
        return super().create(validated_data)
