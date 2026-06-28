import uuid
from django.conf import settings
from django.db import models


class DocumentType(models.Model):
    """
    Defines a document type and its fixed processing route across offices.
    Hardcoded to Business Permit for now; structured so adding new
    document types later is just new rows, not new code.
    """
    name = models.CharField(max_length=150, unique=True)
    route = models.JSONField(help_text='Ordered list of office codes, e.g. ["BPLO", "MPDC", "BFP", "MTO", "BPLO"]')
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class Document(models.Model):
    class Status(models.TextChoices):
        IN_PROGRESS = 'in_progress', 'In Progress'
        COMPLETED = 'completed', 'Completed'
        RELEASED = 'released', 'Released to Citizen'
        MISSING = 'missing', 'Missing'

    document_type = models.ForeignKey(DocumentType, on_delete=models.PROTECT, related_name='documents')
    tracking_number = models.CharField(max_length=20, unique=True, editable=False)
    origin_office = models.CharField(max_length=150, blank=True)
    
    form_data = models.JSONField(default=dict, blank=True)

    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='requested_documents',
    )

    route_position = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.IN_PROGRESS)

    current_handler = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='handled_documents',
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    entered_current_office_at = models.DateTimeField(auto_now_add=True)

    qr_code = models.ImageField(upload_to='document_qr/', blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.tracking_number:
            self.tracking_number = f"QRT-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    @property
    def current_office(self):
        route = self.document_type.route
        if self.route_position < len(route):
            return route[self.route_position]
        return route[-1]

    @property
    def is_final_step(self):
        """True if the document's current position is the LAST step in its route."""
        return self.route_position == len(self.document_type.route) - 1

    def __str__(self):
        return f"{self.tracking_number} — {self.document_type.name} ({self.status})"


class DocumentLog(models.Model):
    class Action(models.TextChoices):
        CREATED = 'created', 'Created'
        SCANNED_ADVANCE = 'scanned_advance', 'Scanned - Advanced to Next Office'
        SCANNED_COMPLETE = 'scanned_complete', 'Scanned - Completed at Origin'
        RELEASED = 'released', 'Released to Citizen'
        FLAGGED_MISSING = 'flagged_missing', 'Flagged Missing'

    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='logs')
    action = models.CharField(max_length=20, choices=Action.choices)
    office = models.CharField(max_length=150)
    acted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name='document_actions',
    )
    notes = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    duration_at_office = models.DurationField(null=True, blank=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"{self.document.tracking_number} — {self.action} @ {self.office}"