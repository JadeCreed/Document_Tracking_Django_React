from rest_framework import generics, status, filters
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.pagination import PageNumberPagination

from .models import User
from .serializers import RegisterSerializer, UserSerializer, CreateEmployeeSerializer
from .permissions import IsAdmin

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Extends the default JWT login serializer to also return
    the logged-in user's role and basic info alongside the tokens.
    """

    def validate(self, attrs):
        data = super().validate(attrs)  # this does the actual email/password check
        data['user'] = UserSerializer(self.user).data
        return data


class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]  # anyone can attempt to log in


class RegisterView(generics.CreateAPIView):
    """
    POST /api/accounts/register/
    Citizen self-registration only.
    """
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]  # anyone (not logged in) can register

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {"message": "Account created successfully.", "user": UserSerializer(user).data},
            status=status.HTTP_201_CREATED
        )


class MeView(APIView):
    """
    GET /api/accounts/me/
    Returns the currently logged-in user's info.
    Frontend calls this after refresh to know who's logged in and their role.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)
    
class UserPagination(PageNumberPagination):
    page_size = 10  # matches your "maximum 10" pagination spec

class UserListView(generics.ListAPIView):
    """
    GET /api/accounts/users/?role=citizen|employee&status=active|inactive
    Admin only. Powers the Users and Archive tables.
    """
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]
    pagination_class = UserPagination

    def get_queryset(self):
        qs = User.objects.all().order_by('-date_joined')

        role = self.request.query_params.get('role')
        if role in ('citizen', 'employee', 'admin'):
            qs = qs.filter(role=role)
        else:
            qs = qs.filter(role='citizen')  # default tab, matches your spec

        status_param = self.request.query_params.get('status')
        if status_param == 'active':
            qs = qs.filter(is_active=True)
        elif status_param == 'inactive':
            qs = qs.filter(is_active=False)

        return qs


class CreateEmployeeView(generics.CreateAPIView):
    """
    POST /api/accounts/users/create-employee/
    Admin only. Creates Employee or Admin accounts directly.
    """
    serializer_class = CreateEmployeeSerializer
    permission_classes = [IsAdmin]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {"message": "Account created successfully.", "user": UserSerializer(user).data},
            status=status.HTTP_201_CREATED
        )


class ToggleUserActiveView(APIView):
    """
    PATCH /api/accounts/users/<id>/toggle-active/
    Admin only. Deactivate sends a user to Archive; Reactivate brings them back.
    """
    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        if user == request.user:
            return Response({"detail": "You cannot deactivate your own account."}, status=status.HTTP_400_BAD_REQUEST)

        user.is_active = not user.is_active
        user.save()
        return Response(UserSerializer(user).data)

class UpdateUserView(generics.UpdateAPIView):
    """
    PATCH /api/accounts/users/<id>/update/
    Admin only. Lets the admin edit office/position/name for an existing account.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]
    http_method_names = ['patch']

    def get_serializer(self, *args, **kwargs):
        kwargs['partial'] = True  # allow updating just some fields, not all required
        return super().get_serializer(*args, **kwargs)
    
    
class OfficialsListView(generics.ListAPIView):
    """
    GET /api/accounts/officials/
    Employees/admins that have a 'position' set — powers the Officials cards page.
    """
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        return User.objects.filter(role__in=['employee', 'admin']).exclude(position__isnull=True).exclude(position='').order_by('first_name')