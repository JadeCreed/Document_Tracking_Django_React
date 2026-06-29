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
from .exports import export_document_as_xlsx

from rest_framework.permissions import AllowAny, IsAuthenticated

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

    Supports ?view=my-requests|to-scan|released&office=BPLO for employees,
    so filtering happens BEFORE pagination, not after. This is critical
    once document volume grows — page 1 of unfiltered results would
    otherwise miss real matches sitting on page 2+.
    """
    permission_classes = [IsStaffUser]
    pagination_class = DocumentPagination

    def get_queryset(self):
        qs = Document.objects.all().order_by('-created_at')

        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)

        view_param = self.request.query_params.get('view')
        office_param = self.request.query_params.get('office')

        if view_param and office_param:
            office_upper = office_param.upper()
            if view_param == 'my-requests':
                qs = qs.filter(origin_office__iexact=office_upper).exclude(status='released')
            elif view_param == 'released':
                qs = qs.filter(origin_office__iexact=office_upper, status='released')
            elif view_param == 'to-scan':
                # current_office is a computed property, not a DB column —
                # can't filter in SQL, so we narrow first then filter in
                # Python. Narrowing to in_progress/missing first keeps this
                # cheap even as total document volume grows, since we're
                # only iterating active documents, not the full history.
                candidates = qs.filter(status__in=['in_progress', 'missing'])
                matching_ids = [
                    d.id for d in candidates
                    if d.route[d.route_position + 1].upper() == office_upper
                    if d.route_position + 1 < len(d.route)
                ]
                qs = qs.filter(id__in=matching_ids)

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
    permission_classes = [IsAuthenticated] 

    def patch(self, request, pk):
        try:
            # Tinitiyak na ang nag-click ay Staff OR ang mismong Citizen na nag-request
            from django.db.models import Q
            document = Document.objects.get(
                Q(pk=pk) & (Q(requested_by=request.user) | Q(current_handler__role__in=['admin', 'employee']))
            )
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
    
class DocumentExportView(APIView):
    """
    GET /api/documents/<id>/export/
    Downloads the document as a filled-in .xlsx matching its physical
    form template, with the QR code embedded at the top for printing.
    """
    permission_classes = [IsStaffUser]

    def get(self, request, pk):
        try:
            document = Document.objects.get(pk=pk)
        except Document.DoesNotExist:
            return Response({"detail": "Document not found."}, status=status.HTTP_404_NOT_FOUND)
        return export_document_as_xlsx(document)
    
class DocumentTypeCreateView(generics.CreateAPIView):
    queryset = DocumentType.objects.all()
    serializer_class = DocumentTypeSerializer
    permission_classes = [IsAdmin]



class ClaimDocumentView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, tracking_number):
        try:
            # Hanapin ang document gamit ang tracking number
            document = Document.objects.get(tracking_number=tracking_number)
            
            # Check kung may nag-claim na
            if document.requested_by:
                return Response({"detail": "This document is already linked to an account."}, status=400)
            
            # I-link ang document sa naka-login na user
            document.requested_by = request.user
            document.save()
            
            return Response(DocumentSerializer(document).data)
        except Document.DoesNotExist:
            return Response({"detail": "Document not found."}, status=404)
        

class MyDocumentsView(generics.ListAPIView):
    serializer_class = DocumentDetailSerializer 
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Ibalik lang ang documents kung saan ang requested_by ay ang current user
        return Document.objects.filter(requested_by=self.request.user).order_by('-updated_at')
    

class DocumentReturnView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            document = Document.objects.get(pk=pk, requested_by=request.user)
            notes = request.data.get('notes', 'No notes provided.')
            
            from .services import return_to_origin
            updated = return_to_origin(document, request.user, notes)
            
            return Response(DocumentDetailSerializer(updated).data)
        except Document.DoesNotExist:
            return Response({"detail": "Document not found or not owned by you."}, status=404)