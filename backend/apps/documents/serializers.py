import io
import qrcode
from django.core.files.base import ContentFile
from rest_framework import serializers
from .models import DocumentType, Document, DocumentLog

class ActorSerializer(serializers.Serializer):
    """
    Nested serializer used wherever we show WHO acted on a document.
    Surfaces unique id + position + office, not just a name, so
    accountability is traceable to a specific person and role.
    """
    id = serializers.IntegerField()
    full_name = serializers.CharField()
    role = serializers.CharField()
    office = serializers.CharField(allow_null=True)
    position = serializers.CharField(allow_null=True)


class DocumentTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentType
        fields = ['id', 'name', 'route', 'is_active']


class DocumentLogSerializer(serializers.ModelSerializer):
    acted_by = ActorSerializer(read_only=True)
    duration_display = serializers.SerializerMethodField()

    class Meta:
        model = DocumentLog
        fields = ['id', 'action', 'office', 'acted_by', 'notes', 'timestamp', 'duration_display']

    def get_duration_display(self, obj):
        if obj.duration_at_office:
            # Formats the time into a readable string like "2h 30m"
            total_seconds = int(obj.duration_at_office.total_seconds())
            hours = total_seconds // 3600
            minutes = (total_seconds % 3600) // 60
            if hours > 0:
                return f"{hours}h {minutes}m"
            return f"{minutes}m"
        return None
    

class DocumentSerializer(serializers.ModelSerializer):
    """
    Used for listing/retrieving documents. Shows CURRENT state at a glance —
    status, current office (derived from route), current handler with their
    unique id/position — without needing to open the history log.
    """
    current_handler = ActorSerializer(read_only=True)
    current_office = serializers.CharField(read_only=True)
    document_type_name = serializers.CharField(source='document_type.name', read_only=True)
    route = serializers.ListField(source='document_type.route', read_only=True)
    requested_by_name = serializers.SerializerMethodField()
    status_label = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = [
            'id', 'tracking_number', 'document_type', 'document_type_name', 'route',
            'form_data', 'requested_by', 'requested_by_name',
            'route_position', 'current_office', 'status', 'status_label', 'current_handler',
            'created_at', 'updated_at', 'entered_current_office_at', 'qr_code',
        ]

    def get_requested_by_name(self, obj):
        if obj.requested_by:
            return obj.requested_by.full_name
        return obj.form_data.get('applicant_name', 'Walk-in / Unregistered')

    def get_status_label(self, obj):
        if obj.status == 'in_progress':
            return f"At {obj.current_office}"
        if obj.status == 'completed':
            return f"Ready at {obj.origin_office}"
        if obj.status == 'released':
            return "Released to Citizen"
        return obj.get_status_display()

class DocumentDetailSerializer(DocumentSerializer):
    """
    Used for the single-document view — includes the FULL history log.
    """
    logs = DocumentLogSerializer(many=True, read_only=True)

    class Meta(DocumentSerializer.Meta):
        fields = DocumentSerializer.Meta.fields + ['logs']


class CreateDocumentSerializer(serializers.ModelSerializer):
    """
    Used when the origin office (e.g. BPLO) creates a new document entry —
    the very first step in the workflow. Automatically creates the first
    DocumentLog entry and generates the document's tracking number.
    """

    class Meta:
        model = Document
        fields = ['document_type', 'form_data', 'requested_by']

    def create(self, validated_data):
        request = self.context['request']
        document = Document.objects.create(
            **validated_data,
            origin_office=request.user.office, 
            status=Document.Status.IN_PROGRESS,
            route_position=0,
            current_handler=request.user,
        )
        DocumentLog.objects.create(
            document=document,
            action=DocumentLog.Action.CREATED,
            office=document.current_office,
            acted_by=request.user,
            notes='Document created and entered into workflow.',
        )
        self._generate_qr_code(document)
        return document

    def _generate_qr_code(self, document):
        # Change this to your frontend URL
        # When scanned, it will open: http://localhost:5173/track/QRT-XXXX
        qr_data = f"http://localhost:5173/track/{document.tracking_number}"
        
        qr_img = qrcode.make(qr_data)
        buffer = io.BytesIO()
        qr_img.save(buffer, format='PNG')
        filename = f"{document.tracking_number}.png"
        document.qr_code.save(filename, ContentFile(buffer.getvalue()), save=True)