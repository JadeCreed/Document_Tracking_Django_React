from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from .models import User


class RegisterSerializer(serializers.ModelSerializer):
    """
    Used ONLY for citizen self-registration.
    Admin/Employee accounts are never created through this serializer.
    """
    password = serializers.CharField(write_only=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'password', 'confirm_password']

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        # Force role to citizen — no matter what the frontend sends, this is the only
        # role self-registration can ever create.
        validated_data['role'] = User.Role.CITIZEN
        user = User.objects.create_user(**validated_data)
        return user


class UserSerializer(serializers.ModelSerializer):
    """
    Used to return safe user info — e.g. after login, or for a 'who am I' endpoint.
    Never includes password.
    """
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'full_name', 'role',
                  'office', 'position', 'is_active', 'date_joined']
        
class CreateEmployeeSerializer(serializers.ModelSerializer):
    """
    Admin-only. Creates Employee or Admin accounts directly
    (no email confirmation flow — matches your spec: admin creates these accounts).
    """
    password = serializers.CharField(write_only=True, validators=[validate_password])
    role = serializers.ChoiceField(choices=[User.Role.EMPLOYEE, User.Role.ADMIN])

    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'password', 'role', 'office', 'position']

    def validate(self, attrs):
        if attrs['role'] == User.Role.EMPLOYEE and not attrs.get('office'):
            raise serializers.ValidationError({"office": "Office is required for employee accounts."})
        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user