from rest_framework import generics, status
from rest_framework.exceptions import ValidationError
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Document, DocumentType, DocumentLog
from .serializers import (
    DocumentSerializer, DocumentDetailSerializer, CreateDocumentSerializer, DocumentTypeSerializer,
)
from .permissions import IsStaffUser
from apps.accounts.permissions import IsAdmin
from .services import process_scan, release_to_citizen, flag_missing
from rest_framework.permissions import AllowAny

from django.db.models import Count, Avg
from datetime import timedelta


class DocumentTypeListView(generics.ListAPIView):
    """
    GET /api/documents/types/
    Lists active document types and their routes — lets the frontend
    know which document types exist and what offices they pass through,
    without hardcoding that in React.
    """
    queryset = DocumentType.objects.filter(is_active=True)
    serializer_class = DocumentTypeSerializer
    permission_classes = [IsStaffUser]


class DocumentPagination(PageNumberPagination):
    page_size = 10


class DocumentListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/documents/           list all documents (staff only)
    POST /api/documents/           create a new document (first office logs the request)
    """
    permission_classes = [IsStaffUser]
    pagination_class = DocumentPagination

    def get_queryset(self):
        qs = Document.objects.all().order_by('-created_at')
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)
        office_param = self.request.query_params.get('office')
        if office_param:
            qs = qs.filter(current_office=office_param)
        return qs

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreateDocumentSerializer
        return DocumentSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        document = serializer.save()
        return Response(DocumentDetailSerializer(document).data, status=status.HTTP_201_CREATED)


class DocumentDetailView(generics.RetrieveAPIView):
    """
    GET /api/documents/<id>/   full detail INCLUDING history log
    """
    queryset = Document.objects.all()
    serializer_class = DocumentDetailSerializer
    permission_classes = [IsStaffUser]


class DocumentTrackingLookupView(generics.RetrieveAPIView):
    """
    GET /api/documents/track/<tracking_number>/
    Public-ish lookup by tracking number — for citizen follow-up,
    matches adviser's note: 'way na makapag follow up si citizen'.
    Works whether or not the citizen registered an account.
    """
    queryset = Document.objects.all()
    serializer_class = DocumentDetailSerializer
    lookup_field = 'tracking_number'
    permission_classes = [AllowAny] 


class DocumentScanView(APIView):
    """
    PATCH /api/documents/<id>/scan/
    """
    permission_classes = [IsStaffUser]

    def patch(self, request, pk): # This must be lowercase 'patch'
        try:
            document = Document.objects.get(pk=pk)
        except Document.DoesNotExist:
            return Response({"detail": "Document not found."}, status=status.HTTP_404_NOT_FOUND)

        office = request.data.get('office')
        notes = request.data.get('notes', '')

        if not office:
            return Response({"office": "This field is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # We use the service logic we wrote earlier
            from .services import process_scan
            updated = process_scan(document, scanning_user=request.user, scanning_office=office, notes=notes)
        except ValidationError as e:
            return Response({"detail": str(e.detail[0]) if hasattr(e, 'detail') else str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(DocumentDetailSerializer(updated).data)

class DocumentReleaseView(APIView):
    """
    PATCH /api/documents/<id>/release/
    Called by the origin office once a Completed document is physically
    handed back to the citizen.
    """
    permission_classes = [IsStaffUser]

    def patch(self, request, pk):
        try:
            document = Document.objects.get(pk=pk)
        except Document.DoesNotExist:
            return Response({"detail": "Document not found."}, status=status.HTTP_404_NOT_FOUND)

        notes = request.data.get('notes', '')

        try:
            updated = release_to_citizen(document, releasing_user=request.user, notes=notes)
        except ValidationError as e:
            return Response({"detail": str(e.detail[0]) if hasattr(e, 'detail') else str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(DocumentDetailSerializer(updated).data)


class DocumentFlagMissingView(APIView):
    """
    PATCH /api/documents/<id>/flag-missing/
    """
    permission_classes = [IsStaffUser]

    def patch(self, request, pk):
        try:
            document = Document.objects.get(pk=pk)
        except Document.DoesNotExist:
            return Response({"detail": "Document not found."}, status=status.HTTP_404_NOT_FOUND)

        notes = request.data.get('notes', '')

        try:
            updated = flag_missing(document, flagging_user=request.user, notes=notes)
        except ValidationError as e:
            return Response({"detail": str(e.detail[0]) if hasattr(e, 'detail') else str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(DocumentDetailSerializer(updated).data)
    

class AdminDashboardStatsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        total = Document.objects.count()
        pending = Document.objects.filter(status='in_progress').count()
        completed = Document.objects.filter(status='completed').count()
        released = Document.objects.filter(status='released').count()
        
        return Response({
            "total": total,
            "pending": pending,
            "completed": completed,
            "released": released
        })

class HeatmapDataView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        # We calculate the average time spent in each office based on logs
        stats = DocumentLog.objects.exclude(duration_at_office__isnull=True).values('office').annotate(
            avg_time=Avg('duration_at_office'),
            doc_count=Count('id')
        ).order_by('avg_time')

        # Format the duration for the frontend (convert to hours)
        formatted_stats = []
        for item in stats:
            hours = item['avg_time'].total_seconds() / 3600
            formatted_stats.append({
                "office": item['office'],
                "avg_hours": round(hours, 2),
                "count": item['doc_count']
            })

        return Response(formatted_stats)